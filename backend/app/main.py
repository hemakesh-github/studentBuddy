from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import shutil
import os
from pathlib import Path

from app import auth
from app.database import get_db, engine
from app.auth import models, schemas, security
from app.quiz.document_parser import DocumentParserFactory
from app.quiz.quiz_generator import QuizGenerator

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_active_user)
):
    return current_user

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/generate-quiz")
async def generate_quiz_from_document(
    file: UploadFile = File(...),
    questions_per_section: int = 3,
    current_user: models.User = Depends(security.get_current_active_user)
):
    """
    Generate quiz questions from uploaded document
    """
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create parser
        parser = DocumentParserFactory.create_parser(
            str(file_path),
            max_section_length=1000
        )
        
        # Parse document
        sections = parser.parse(str(file_path))
        
        # Initialize quiz generator
        quiz_generator = QuizGenerator()
        
        # Generate questions for each section
        quiz_results = {}
        for section in sections:
            section_key = f"Page {section.page_number} - Section {section.section_number}" if section.page_number else f"Section {section.section_number}"
            
            questions = quiz_generator.generate_quiz(
                context=section.content,
                num_questions=questions_per_section
            )
            
            quiz_results[section_key] = quiz_generator.to_json(questions)
        
        # Clean up uploaded file
        os.remove(file_path)
        
        return {
            "status": "success",
            "data": quiz_results
        }
        
    except Exception as e:
        # Clean up uploaded file if it exists
        if file_path.exists():
            os.remove(file_path)
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 