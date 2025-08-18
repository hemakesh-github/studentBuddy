
# Doubt history endpoint
from fastapi import Query

from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Body, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import shutil
import os
from pathlib import Path
import asyncio
import time
import platform
import json
import traceback
import base64
from langchain_core.messages import HumanMessage
from . import models, schemas  # Use relative imports
from .database import get_db, engine
from .auth import security
from .document_parser import DocumentParserFactory  # Remove backend prefix
from .quiz.quiz_generator import QuizGenerator


# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Add constants
QUIZ_GENERATION_TIMEOUT = 120  # Increase timeout to 120 seconds
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_SECTIONS = 10

@app.post("/login", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    print(f"Login attempt for user: {form_data.username}")
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
    print(access_token)
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
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate quiz questions from uploaded document with timeout and size checks.
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
                detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE / 1024 / 1024}MB"
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
            sections = parser.parse(str(file_path))

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
                    quiz_generator.generateQuiz(
                        context=section.content,
                        N=min(questions_per_section, 5)  # Limit questions per section
                    ),
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
            # Don't clean up file yet - we need to save it for download
            pass
            
        # Save quiz to database
        try:
            quiz = models.Quiz(
                title=file.filename.split('.')[0],  # Use filename without extension as title
                content=quiz_results,
                user_id=current_user.id,
                filename=file.filename,
                file_path=str(file_path)  # Keep file for download
            )
            db.add(quiz)
            db.commit()
            db.refresh(quiz)
            
            return {
                "quiz_id": quiz.id,
                "data": quiz_results,
                "processing_time": round(time.time() - start_time, 2)
            }
        except Exception as e:
            # If database save fails, clean up file and continue
            if file_path and file_path.exists():
                os.remove(file_path)
            print(f"Error saving quiz to database: {str(e)}")
            return {
                "data": quiz_results,
                "processing_time": round(time.time() - start_time, 2),
                "warning": "Quiz generated but not saved to history"
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

@app.post("/api/solve-doubt")
async def solve_doubt(
    question: str = Form(None),
    subjects: str = Form(None),
    conversation: str = Form(None),
    context_pdf: UploadFile = File(None),
    context_image: UploadFile = File(None),
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        print("Received request to solve doubt")
        
        # Validate that we have a question
        if not question or not question.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question is required"
            )

        # Handle PDF file if provided
        pdf_content = None
        if context_pdf is not None:
            print("Processing PDF for context...")
            try:
                file_path = UPLOAD_DIR / context_pdf.filename
                with file_path.open("wb") as buffer:
                    shutil.copyfileobj(context_pdf.file, buffer)

                # Create parser
                parser = DocumentParserFactory.create_parser(
                    str(file_path),
                    max_section_length=1000
                )
                sections = parser.parse(str(file_path))
                print(f"Parsed PDF sections: {len(sections)}")
                
                # Combine PDF content
                pdf_text = ""
                for section in sections[:5]:  # Limit to first 5 sections
                    pdf_text += f"Page {section.page_number}: {section.content}\n\n"
                
                if pdf_text:
                    question = f"{question}\n\nContext from PDF: {pdf_text}"
                
                # Clean up PDF file after processing
                os.remove(file_path)
            except Exception as e:
                print(f"Error processing PDF: {str(e)}")
                # Continue without PDF context if processing fails

        # Handle image file if provided
        image_data = None
        if context_image is not None:
            print("Processing image for context...")
            try:
                # Read image content
                image_content = await context_image.read()
                
                # Convert to base64
                image_base64 = base64.b64encode(image_content).decode('utf-8')
                image_data = {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{context_image.content_type};base64,{image_base64}"
                    }
                }
                print(f"Processed image: {context_image.filename}, type: {context_image.content_type}")
                
            except Exception as e:
                print(f"Error processing image: {str(e)}")
                # Continue without image context if processing fails

        print(f"Final question: {question}")

        # Parse subjects
        subject_list = []
        if subjects:
            subject_list = [s.strip() for s in subjects.split(',') if s.strip()]

        # Parse conversation history
        conversation_history = []
        if conversation:
            try:
                conversation_history = json.loads(conversation)
            except Exception as e:
                print(f"Error parsing conversation: {e}")
                conversation_history = []

        # Compose prompt for LLM
        prompt = "You are an AI tutor. Answer the user's academic question in a clear, step-by-step way."
        
        if subject_list:
            prompt += f" Subject(s): {', '.join(subject_list)}."
        
        if context_pdf is not None:
            prompt += " (A context PDF was provided.)"
            
        if context_image is not None:
            prompt += " (A context image was provided.)"

        # Add conversation history to prompt
        if conversation_history:
            prompt += "\n\nConversation History:"
            for msg in conversation_history[-5:]:  # Limit to last 5 messages
                if msg.get('role') == 'user':
                    prompt += f"\nUser: {msg.get('content', '')}"
                elif msg.get('role') == 'assistant' or msg.get('role') == 'ai':
                    prompt += f"\nAI: {msg.get('content', '')}"

        # Add current question
        prompt += f"\n\nCurrent Question: {question}\n\nAI:"

        print(f"Sending prompt to LLM: {prompt[:200]}...")

        # Generate response using LLM directly
        from .llm.config import LLMConfig
        llm_config = LLMConfig()
        
        # Use HumanMessage if image is provided, otherwise use simple string
        if image_data:
            # Create message content with text and image
            message_content = [
                {"type": "text", "text": prompt}
            ]
            message_content.append(image_data)
            
            print(f"Sending multimodal message with {len(message_content)} parts...")
            
            # Use HumanMessage for multimodal input
            human_message = HumanMessage(content=message_content)
            response = llm_config.llm.invoke([human_message])
            
            print(f"Multimodal response type: {type(response)}")
            print(f"Multimodal response: {response}")
            print(f"Response attributes: {dir(response)}")
        else:
            # Use simple string invocation for text-only
            print("Sending text-only message...")
            response = llm_config.llm.invoke(prompt)
            print(f"Text response type: {type(response)}")
            
        # Enhanced response parsing
        answer = None
        if hasattr(response, 'content'):
            answer = response.content
            print(f"Using response.content: {answer[:100] if answer else 'None'}...")
        elif isinstance(response, str):
            answer = response
            print(f"Response is string: {answer[:100]}...")
        else:
            answer = str(response)
            print(f"Converting response to string: {answer[:100]}...")
            
        if not answer or not answer.strip():
            print("WARNING: Empty or None answer received")
            answer = "Sorry, I couldn't generate a response. Please try again."

        print(f"Generated answer: {answer[:100]}...")

        # Save the doubt to database
        try:
            doubt = models.Doubt(
                user_id=current_user.id,
                question=question,
                answer=answer,
                subjects=subjects if subjects else "",
                conversation_history=conversation_history + [
                    {"role": "user", "content": question},
                    {"role": "assistant", "content": answer}
                ],
                context_filename=context_pdf.filename if context_pdf else (context_image.filename if context_image else None)
            )
            db.add(doubt)
            db.commit()
            db.refresh(doubt)
            print(f"Saved doubt with ID: {doubt.id}")
        except Exception as e:
            print(f"Error saving doubt: {str(e)}")
            # Don't fail the request if saving fails
            pass

        return {
            "answer": answer,
            "status": "success",
            "debug": {
                "answer_length": len(answer) if answer else 0,
                "has_image": image_data is not None,
                "response_type": str(type(response))
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in solve_doubt: {str(e)}")
        import traceback
        traceback.print_exc()  # Print full traceback for debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

@app.post("/api/submit-quiz-attempt")
async def submit_quiz_attempt(
    attempt_data: dict,
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        # Create quiz attempt record
        quiz_attempt = models.QuizAttempt(
            quiz_id=attempt_data.get('quiz_id'),
            user_id=current_user.id,
            answers=attempt_data.get('answers', {}),
            score=attempt_data.get('score', 0),
            total_questions=attempt_data.get('total_questions', 0),
            time_taken=attempt_data.get('time_taken', 0)
        )
        
        db.add(quiz_attempt)
        db.commit()
        db.refresh(quiz_attempt)
        
        return {
            "status": "success",
            "attempt_id": quiz_attempt.id,
            "message": "Quiz attempt saved successfully"
        }
    except Exception as e:
        print(f"Error saving quiz attempt: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save quiz attempt: {str(e)}"
        )

@app.get("/api/download-file/{quiz_id}")
async def download_file(
    quiz_id: int,
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Find the quiz
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.user_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if not quiz.file_path or not os.path.exists(quiz.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=quiz.file_path,
        filename=quiz.filename,
        media_type='application/octet-stream'
    )

@app.get("/api/doubt-history")
async def get_doubt_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    subject: Optional[str] = Query(None),
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Doubt).filter(models.Doubt.user_id == current_user.id)
    if subject:
        query = query.filter(models.Doubt.subjects.contains(subject))
    total = query.count()
    doubts = query.order_by(models.Doubt.created_at.desc()).offset(skip).limit(limit).all()
    # Return all fields including conversation_history
    return {
        "total": total,
        "doubts": [
            {
                "id": d.id,
                "question": d.question,
                "answer": d.answer,
                "subjects": d.subjects,
                "conversation_history": d.conversation_history,
                "context_filename": d.context_filename,
                "created_at": d.created_at
            } for d in doubts
        ]
    }
# Get a single doubt by ID
@app.get("/api/doubt/{doubt_id}")
async def get_doubt(
    doubt_id: int,
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    doubt = db.query(models.Doubt).filter(
        models.Doubt.id == doubt_id,
        models.Doubt.user_id == current_user.id
    ).first()
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")
        
    return {
        "id": doubt.id,
        "question": doubt.question,
        "answer": doubt.answer,
        "subjects": doubt.subjects,
        "conversation_history": doubt.conversation_history,
        "context_filename": doubt.context_filename,
        "created_at": doubt.created_at
    }

# Get a single quiz by ID
@app.get("/api/quiz/{quiz_id}")
async def get_quiz(
    quiz_id: int,
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(models.Quiz).filter(
        models.Quiz.id == quiz_id,
        models.Quiz.user_id == current_user.id
    ).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    print(f"Retrieved quiz: {quiz.title} (ID: {quiz.id}), {quiz}")
    print({
        "id": quiz.id,
        "title": quiz.title,
        "content": quiz.content,
        "filename": quiz.filename,
        "created_at": quiz.created_at,
        "total_questions": sum(len(section) for section in quiz.content) if quiz.content else 0
    })
    return {
        "id": quiz.id,
        "title": quiz.title,
        "content": quiz.content,
        "filename": quiz.filename,
        "created_at": quiz.created_at,
        "total_questions": sum(len(section) for section in quiz.content) if quiz.content else 0
    }

# User profile endpoint
@app.get("/api/profile")
async def get_user_profile(
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get user stats
    total_doubts = db.query(models.Doubt).filter(models.Doubt.user_id == current_user.id).count()
    total_quizzes = db.query(models.Quiz).filter(models.Quiz.user_id == current_user.id).count()
    total_quiz_attempts = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).count()
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "total_doubts": total_doubts,
        "total_quizzes": total_quizzes,
        "total_quiz_attempts": total_quiz_attempts
    }

# Quiz history endpoint
@app.get("/api/quiz-history")
async def get_quiz_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    total = db.query(models.Quiz).filter(models.Quiz.user_id == current_user.id).count()
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.user_id == current_user.id
    ).order_by(models.Quiz.created_at.desc()).offset(skip).limit(limit).all()
    
    quiz_data = []
    for q in quizzes:
        # Get attempts for this quiz
        attempts = db.query(models.QuizAttempt).filter(
            models.QuizAttempt.quiz_id == q.id,
            models.QuizAttempt.user_id == current_user.id
        ).order_by(models.QuizAttempt.completed_at.desc()).all()
        
        # Calculate stats
        total_attempts = len(attempts)
        best_score = max([a.score for a in attempts]) if attempts else 0
        
        quiz_data.append({
            "id": q.id,
            "title": q.title,
            "filename": q.filename,
            "created_at": q.created_at,
            "total_questions": sum(len(section) for section in q.content) if q.content else 0,
            "file_path": q.file_path,
            "total_attempts": total_attempts,
            "best_score": best_score,
            "attempts": [
                {
                    "id": a.id,
                    "score": a.score,
                    "total_questions": a.total_questions,
                    "time_taken": a.time_taken,
                    "completed_at": a.completed_at
                } for a in attempts
            ]
        })
    
    return {
        "total": total,
        "quizzes": quiz_data
    }

# Quiz attempts history endpoint (separate from quiz history)
@app.get("/api/quiz-attempts")
async def get_quiz_attempts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    total = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).count()
    quiz_attempts = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id
    ).order_by(models.QuizAttempt.completed_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "quiz_attempts": [
            {
                "id": qa.id,
                "quiz_id": qa.quiz_id,
                "total_questions": qa.total_questions,
                "score": qa.score,
                "time_taken": qa.time_taken,
                "completed_at": qa.completed_at
            } for qa in quiz_attempts
        ]
    }