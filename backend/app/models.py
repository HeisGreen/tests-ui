from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, Text, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    TRAVEL_AGENT = "TRAVEL_AGENT"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user profile
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    # Relationship to travel agent profile
    agent_profile = relationship("TravelAgentProfile", back_populates="user", uselist=False)
    # Relationships for conversations
    conversations_as_user = relationship("Conversation", foreign_keys="Conversation.user_id", back_populates="user")
    conversations_as_agent = relationship("Conversation", foreign_keys="Conversation.agent_id", back_populates="agent")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    onboarding_data = Column(JSON, nullable=True)  # Stores IntakeData as JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship back to user
    user = relationship("User", back_populates="profile")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    input_data = Column(JSON, nullable=True)  # The intake JSON sent to OpenAI
    output_data = Column(JSON, nullable=True)  # The parsed recommendation response
    raw_response = Column(Text, nullable=True)  # Raw ChatGPT response string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to user
    user = relationship("User")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=True)  # e.g., "Passport", "Bank Statement", etc.
    file_url = Column(String, nullable=False)  # Firebase Storage URL
    file_path = Column(String, nullable=False)  # Firebase Storage path
    size = Column(String, nullable=True)  # File size as string (e.g., "2.4 MB")
    status = Column(String, default="pending", nullable=False)  # pending, verified, rejected
    visa_id = Column(Integer, nullable=True)  # Optional reference to visa application
    description = Column(Text, nullable=True)  # Additional details about the document
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to user
    user = relationship("User")


class ChecklistProgress(Base):
    __tablename__ = "checklist_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    visa_type = Column(String, nullable=False, index=True)  # Visa type identifier
    progress_json = Column(JSON, nullable=False)  # Stores { "step-1": true, "step-2": false, ... }
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to user
    user = relationship("User")


class ChecklistCache(Base):
    __tablename__ = "checklist_cache"
    __table_args__ = (
        UniqueConstraint("user_id", "visa_type", name="uq_checklist_cache_user_visa"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    visa_type = Column(String, nullable=False, index=True)
    option_hash = Column(String, nullable=True, index=True)
    checklist_json = Column(JSON, nullable=False)
    source = Column(String, default="cache", nullable=False)  # cache | ai | cache_fallback
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")


class TravelAgentProfile(Base):
    __tablename__ = "travel_agent_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    onboarding_data = Column(JSON, nullable=True)  # Stores TravelAgentOnboardingData as JSON
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship back to user
    user = relationship("User", back_populates="agent_profile")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    last_message_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="conversations_as_user")
    agent = relationship("User", foreign_keys=[agent_id], back_populates="conversations_as_agent")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
