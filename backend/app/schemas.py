from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

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

    class Config:
        from_attributes = True 