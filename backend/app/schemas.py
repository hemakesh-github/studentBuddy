from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    title: str

class QuizCreate(QuizBase):
    pass

class Quiz(QuizBase):
    id: int
    content: Dict[str, Any]
    user_id: int
    filename: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QuizAttemptBase(BaseModel):
    answers: Dict[str, Any]
    score: float
    total_questions: int
    time_taken: int

class QuizAttemptCreate(QuizAttemptBase):
    quiz_id: int

class QuizAttempt(QuizAttemptBase):
    id: int
    quiz_id: int
    user_id: int
    completed_at: datetime
    quiz: Optional[Quiz] = None

    class Config:
        from_attributes = True

class DoubtBase(BaseModel):
    question: str
    subjects: Optional[str] = None

class DoubtCreate(DoubtBase):
    pass

class Doubt(DoubtBase):
    id: int
    user_id: int
    answer: str
    conversation_history: Optional[Dict[str, Any]] = None
    context_filename: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    user: User
    total_quizzes: int
    total_attempts: int
    average_score: float
    total_doubts: int
    recent_activity: List[Dict[str, Any]]

    class Config:
        from_attributes = True