from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, JSON, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    username = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quizzes = relationship("Quiz", back_populates="owner")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    doubts = relationship("Doubt", back_populates="user")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    content = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String(255))  # Original uploaded file name
    file_path = Column(String(500))  # Path to stored file for download
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    answers = Column(JSON)  # Store user's answers
    score = Column(Float)  # Score achieved
    total_questions = Column(Integer)
    time_taken = Column(Integer)  # Time in seconds
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")

class Doubt(Base):
    __tablename__ = "doubts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question = Column(Text)
    answer = Column(Text)
    subjects = Column(String(500))  # Comma-separated subjects
    conversation_history = Column(JSON)  # Full conversation
    context_filename = Column(String(255))  # If PDF/image was uploaded
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="doubts")