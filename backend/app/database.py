from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection to Render
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URI")

# Create engine and session
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test the connection (optional - can be removed later)
def test_connection():
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

# Only create tables when this file is run directly
if __name__ == "__main__":
    from app import models
    print("Creating tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
    test_connection()