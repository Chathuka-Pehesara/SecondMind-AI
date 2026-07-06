from pydantic import field_validator
from pydantic import BaseModel,EmailStr, Field
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, message="Password must be at least 6 charcters long")

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

class ConversationBase(BaseModel):
    title: str

class ConversationResponse(ConversationBase):
    id: str
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
    
class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime
    citations: Optional[str] = None
    confidence_score: float | None = None

    @field_validator('citations', mode='before')
    @classmethod
    def parse_citation(cls,v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v] if v else []
        
        return v or []

    class Config:
        from_attributes = True 

class UserPreferenceBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1)

class UserPreferenceCreate(UserPreferenceBase):
    pass

class UserPreferenceResponse(UserPreferenceBase):
    id: int
    user_id: int
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None 
    status: str = "active" # active, completed, archived
    target_date: Optional[datetime] = None

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: int
    user_id: int
    updated_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class GoalUpdate(GoalBase):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[datetime] = None

class ProjectBase(BaseModel):
    name: str = Field()
    description: Optional[str] = None
    status: str = "active"  # planning, active, completed, on_hold

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FactBase(BaseModel):
    content: str = Field(..., min_length=1)

class FactCreate(FactBase):
    pass

class FactUpdate(FactBase):
    pass

class FactResponse(FactBase):
    id: int
    user_id: int
    created_at:  datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MemorySummaryResponse(BaseModel):
    preferences: List[UserPreferenceResponse]
    goals: List[GoalResponse]
    projects: List[ProjectResponse]
    facts: List[FactResponse]

class DocumentBase(BaseModel):
    filename: str
    file_size: int

class DocumentResponse(DocumentBase):
    id: str
    conversation_id: str
    created_at: datetime

    class config:
        from_attributes = True