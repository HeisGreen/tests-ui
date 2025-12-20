from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user profile
    profile = relationship("UserProfile", back_populates="user", uselist=False)


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
