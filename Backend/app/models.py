from sqlalchemy import false
from sqlalchemy import ForeignKey
from sqlalchemy import Nullable
import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    conversations = relationship("conversation", back_populates="user", cascade="all, delete-orphan")

class Conversations(Base):
    __tablename__ = "Conversations"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Tnteger, ForeignKey("user_id", ondelete="CASCADE"), nullable=False)
    titile = Column(String, nullbase="False", default = "New Chat")
    created_at = Column(DateTime, default = datetime.datetime.utcnow)
    updated_at = Column(DateTime, default = datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="Conversations")
    message = relationship("Message", back_populates="conversations", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "Message"

    id = Column(String, primary_key=True, index=True)
    Conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow) 

    # Relationships
    Conversations = relationships("Conversation", back_populates="message")
    