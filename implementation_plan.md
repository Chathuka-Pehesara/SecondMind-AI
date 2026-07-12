# Implementation Plan - Complete Manual Authentication System

This plan outlines all the steps, files, and complete code blocks required to implement a robust, secure, and beautiful JWT-based authentication system from scratch. 

We will use:
- **Backend**: FastAPI, SQLite (with SQLAlchemy ORM), JWT (via PyJWT), bcrypt (for hashing).
- **Frontend**: React (Vite), Tailwind CSS v4, Framer Motion, Lucide React (using existing custom UI components like `Button` and `GlassCard`).

---

## Proposed File Structure

We will create a new `Backend` directory and add several files to the existing `Frontend` project:

```text
SecondMind AI/
├── Backend/                    # [NEW] FastAPI Backend
│   ├── requirements.txt
│   ├── .env
│   └── app/
│       ├── __init__.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── auth.py
│       └── main.py
└── Frontend/                   # [EXISTING] React Frontend
    └── src/
        ├── context/
        │   └── AuthContext.tsx  # [NEW] Handles auth state & persistent login
        ├── components/
        │   └── auth/
        │       └── ProtectedRoute.tsx # [NEW] Route guard
        ├── pages/
        │   └── Auth/
        │       ├── LoginPage.tsx      # [NEW] Beautiful glassmorphism Login
        │       └── RegisterPage.tsx   # [NEW] Beautiful glassmorphism Register
        ├── App.tsx             # [MODIFY] Added routing guards & auth context
        └── components/
            └── layout/
                ├── Sidebar.tsx # [MODIFY] Connected to actual Auth profile & logout
                └── TopNav.tsx  # [MODIFY] Profile display/actions
```

---

## Proposed Changes

### 1. Backend Components

#### [NEW] [requirements.txt](file:///e:/Git_Projects/SecondMind%20AI/Backend/requirements.txt)
Defines all the required libraries for our secure backend.
```text
fastapi>=0.110.0
uvicorn>=0.28.0
sqlalchemy>=2.0.28
pyjwt>=2.8.0
bcrypt>=4.1.2
python-multipart>=0.0.9
python-dotenv>=1.0.1
pydantic[email]>=2.6.4
```

#### [NEW] [.env](file:///e:/Git_Projects/SecondMind%20AI/Backend/.env)
Store secret configurations. Keep `SECRET_KEY` secret.
```env
DATABASE_URL=sqlite:///./secondmind.db
JWT_SECRET_KEY=9a6d8e27c1543be8a9b2bdf6c7e2a4a83e0c451639d6cfb33bf6f97ef7da01c3
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

#### [NEW] [database.py](file:///e:/Git_Projects/SecondMind%20AI/Backend/app/database.py)
Initializes database connections and session yield helper.
```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./secondmind.db")

# connect_args={"check_same_thread": False} is required only for SQLite
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### [NEW] [models.py](file:///e:/Git_Projects/SecondMind%20AI/Backend/app/models.py)
SQLAlchemy model definition for the `User`.
```python
import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
```

#### [NEW] [schemas.py](file:///e:/Git_Projects/SecondMind%20AI/Backend/app/schemas.py)
Pydantic schemas for form validation and API data transmission.
```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, message="Password must be at least 6 characters long")

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
```

#### [NEW] [auth.py](file:///e:/Git_Projects/SecondMind%20AI/Backend/app/auth.py)
Handles JWT payload parsing, token verification, password verification/hashing (using `bcrypt` directly to ensure Python 3.12 compatibility), and the FastAPI dependency configuration.
```python
import os
import datetime
import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import TokenData

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-fallback-super-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Passlib-free clean bcrypt implementation
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_access_token(data: dict, expires_delta: datetime.timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_411_LENGTH_REQUIRED, # Standard unauthorized code
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # Patch HTTP_401_UNAUTHORIZED manually (fastapi default structure)
    credentials_exception.status_code = status.HTTP_401_UNAUTHORIZED
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user
```

#### [NEW] [main.py](file:///e:/Git_Projects/SecondMind%20AI/Backend/app/main.py)
Aggregates the routes, implements sqlite auto-migrations on startup, configures wide CORS headers for local testing, and exposes authentication routes.
```python
from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, UserLogin, Token
from app.auth import hash_password, verify_password, create_access_token, get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SecondMind AI Authentication Service")

# Setup CORS for Frontend React integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite development URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    # Hash password and create record
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
```

---

### 2. Frontend Components

#### [NEW] [AuthContext.tsx](file:///e:/Git_Projects/SecondMind%20AI/Frontend/src/context/AuthContext.tsx)
Context hook orchestrating active tokens, client state, register/login network triggers, and auto-restoring token on page refreshes.
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:8000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('secondmind-token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Auto-fetch profile validation on initial mounting if token exists
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to validate token:', err);
        // Keep offline token or log out depending on choice. We clear for safety.
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to login');
      }

      localStorage.setItem('secondmind-token', data.access_token);
      setToken(data.access_token);
      
      // Get profile details immediately
      const profileResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        }
      });
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setUser(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // Automatically log in after registration
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Server connection error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('secondmind-token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### [NEW] [ProtectedRoute.tsx](file:///e:/Git_Projects/SecondMind%20AI/Frontend/src/components/auth/ProtectedRoute.tsx)
Guard component to prevent unauthorized visits to the user dashboard.
```tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-darkBg flex flex-col items-center justify-center relative">
        <div className="glow-orb w-[400px] h-[400px] bg-brand-500/10 -top-20 -right-20" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 animate-pulse">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-450 tracking-wider">
            Accessing Mind Vault...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

#### [NEW] [LoginPage.tsx](file:///e:/Git_Projects/SecondMind%20AI/Frontend/src/pages/Auth/LoginPage.tsx)
Stunning login visual utilizing existing UI elements.
```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Client Validation
    if (!email || !password) {
      setFormError('Please fill in all credentials');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // API error handled by Context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow animations */}
      <div className="glow-orb w-[500px] h-[500px] bg-brand-500/10 -top-20 -right-20 animate-float" />
      <div className="glow-orb w-[600px] h-[600px] bg-indigo-500/5 -bottom-40 -left-20 animate-float-delayed" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Brain className="w-5.5 h-5.5" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
              SecondMind
            </span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-2">Access your cognitive memories and nodes</p>
        </div>

        <GlassCard glowColor="rgba(139, 92, 246, 0.1)">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-6 text-center">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message banner */}
            {(formError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError || error}</span>
              </motion.div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-550" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
                <a href="#" className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-550" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-650 dark:hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-450">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Create an account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
```

#### [NEW] [RegisterPage.tsx](file:///e:/Git_Projects/SecondMind%20AI/Frontend/src/pages/Auth/RegisterPage.tsx)
Registration page matching the brand aesthetics.
```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Lock, Mail, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const { register, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Client Form Validations
    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please fill in all details');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      // API error handled by Context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow animations */}
      <div className="glow-orb w-[500px] h-[500px] bg-brand-500/10 -top-20 -right-20 animate-float" />
      <div className="glow-orb w-[600px] h-[600px] bg-indigo-500/5 -bottom-40 -left-20 animate-float-delayed" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Brain className="w-5.5 h-5.5" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
              SecondMind
            </span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-2">Initialize your local memory container</p>
        </div>

        <GlassCard glowColor="rgba(139, 92, 246, 0.1)">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-6 text-center">Create Workspace</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message banner */}
            {(formError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError || error}</span>
              </motion.div>
            )}

            {/* Display Name field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-555" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-550" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-550" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-650 dark:hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Confirmation field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider pl-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-550" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl focus:outline-none focus:border-brand-500/50 dark:focus:border-brand-400/50 focus:bg-white dark:focus:bg-zinc-900/80 transition-all text-slate-800 dark:text-zinc-200"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" disabled={submitting}>
              {submitting ? 'Registering Workspace...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-450">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
              Sign In
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
```

#### [MODIFY] [App.tsx](file:///e:/Git_Projects/SecondMind%20AI/Frontend/src/App.tsx)
Update routing configuration. Integrate `AuthProvider`, protect `/dashboard` routes, and map `/login` / `/register` paths.
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/Landing/LandingPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { MemoriesPage } from './pages/Dashboard/MemoriesPage';
import { ConnectionsPage } from './pages/Dashboard/ConnectionsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Marketing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Authentication Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Dashboard Application Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="dashboard/memories" element={<MemoriesPage />} />
                <Route path="dashboard/connections" element={<ConnectionsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Fallback redirect to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

#### [MODIFY] [Sidebar.tsx](file:///e:/Git_Projects/SecondMind%20AI/Frontend/src/components/layout/Sidebar.tsx)
Retrieve real-time user info from context, build user display details, and integrate the logout trigger.
```tsx
// Replace the top imports & profile card in e:\Git_Projects\SecondMind AI\Frontend\src\components\layout\Sidebar.tsx
// Add import:
// import { useAuth } from '../../context/AuthContext';

// Inside the Sidebar component (line 19):
// const { user, logout } = useAuth();
// const userInitials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

// Replace lines 121-133 with the following code to make the profile card dynamic and link logout:
```
```tsx
          {/* Profile Card Dynamic Integration */}
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-100/50 dark:hover:bg-zinc-800/20 transition-all group relative">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-brand-500/10 flex items-center justify-center font-display font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
              {userInitials}
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white dark:border-zinc-950 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                {user?.full_name || 'User Profile'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-455 truncate">
                {user?.email || 'authenticated'}
              </p>
            </div>
            <button 
              onClick={logout}
              title="Logout"
              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/40"
            >
              {/* Logout icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
```

#### [MODIFY] [SettingsPage.tsx](file:///e:/Git_Projects/SecondMind%20AI/Frontend/src/pages/Settings/SettingsPage.tsx)
Integrate AuthContext into Settings page to display authentic profile credentials.
```tsx
// Inside SettingsPage component (line 17):
// Add import: import { useAuth } from '../../context/AuthContext';
// Get hook variables: const { user } = useAuth();

// Replace input value displays inside the tab === 'general' block:
// Replace line 85 (Display Name input) value with: defaultValue={user?.full_name || ''}
// Replace line 93 (Primary Email input) value with: defaultValue={user?.email || ''}
```

---

## Verification Plan

### Automated Verification
After setting up, run the following validation:
1. Start FastAPI:
   ```bash
   cd Backend
   # Create a virtualenv
   python -m venv venv
   # Activate virtualenv (Windows)
   .\venv\Scripts\activate
   # Install dependencies
   pip install -r requirements.txt
   # Run local server
   uvicorn app.main:app --reload
   ```
2. Verify API endpoints via swagger docs:
   - Navigate to `http://localhost:8000/docs` in your browser.
   - Run tests on register, login, and profile fetching.

### Manual Verification
1. Open the Vite frontend:
   ```bash
   cd Frontend
   npm run dev
   ```
2. Go to `http://localhost:5173`. Attempt to navigate to `http://localhost:5173/dashboard`. The route guard should redirect you to `http://localhost:5173/login`.
3. Try registering a user via `/register` with mismatching passwords or duplicate email to confirm error messages.
4. Log in successfully and check if profile values inside the dashboard sidebar and settings update.
5. Close the tab and reopen it to ensure persistent login works.
6. Click the logout button to clear access tokens and verify redirection back to login.
