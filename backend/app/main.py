from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import shutil
import os
from pathlib import Path
import asyncio
import time

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Add constants
QUIZ_GENERATION_TIMEOUT = 90  # seconds
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_SECTIONS = 10

@app.post("/login", response_model=schemas.Token)
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
    Generate quiz questions from uploaded document with timeout and size checks
    """
    start_time = time.time()
    file_path = None
    
    try:
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset file pointer
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE/1024/1024}MB"
            )

        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create parser with timeout
        parser = DocumentParserFactory.create_parser(
            str(file_path),
            max_section_length=1000
        )
        
        # Parse document with timeout
        try:
            sections = await asyncio.wait_for(
                asyncio.create_task(parser.parse(str(file_path))), 
                timeout=QUIZ_GENERATION_TIMEOUT/2  # Half time for parsing
            )
            
            if len(sections) > MAX_SECTIONS:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Document contains too many sections (max {MAX_SECTIONS})"
                )
                
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail="Document parsing is taking too long. Please try with a smaller document."
            )
        
        # Check remaining time
        elapsed_time = time.time() - start_time
        remaining_time = QUIZ_GENERATION_TIMEOUT - elapsed_time
        
        if remaining_time < 10:  # If less than 10 seconds remaining
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail="Not enough time remaining to generate questions. Please try with a smaller document."
            )
        
        # Initialize quiz generator
        quiz_generator = QuizGenerator()
        quiz_results = []
        
        # Generate questions with dynamic timeout
        try:
            time_per_section = remaining_time / len(sections)
            for section in sections:
                questions = await asyncio.wait_for(
                    asyncio.create_task(quiz_generator.generateQuiz(
                        context=section.content,
                        N=min(questions_per_section, 5)  # Limit questions per section
                    )),
                    timeout=time_per_section
                )
                quiz_results.append(questions)
                
                # Update remaining time
                elapsed_time = time.time() - start_time
                if elapsed_time > QUIZ_GENERATION_TIMEOUT * 0.9:  # 90% of timeout
                    break
                    
        except asyncio.TimeoutError:
            if quiz_results:  # Return partial results if we have any
                return {
                    "data": quiz_results,
                    "warning": "Some sections were skipped due to time constraints"
                }
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail="Quiz generation is taking too long. Please try with fewer sections."
            )

        finally:
            # Clean up uploaded file
            if file_path and file_path.exists():
                os.remove(file_path)
            
        return {
            "data": quiz_results,
            "processing_time": round(time.time() - start_time, 2)
        }
        
    except HTTPException as he:
        if file_path and file_path.exists():
            os.remove(file_path)
        raise he
        
    except Exception as e:
        if file_path and file_path.exists():
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during quiz generation: {str(e)}"
        )