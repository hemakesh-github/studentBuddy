from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Update the database URL with the provided connection details
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://avnadmin:AVNS_ytgB2UKeE-RQJhp_EMu@mysql-2bf14153-hemakesh8333-ce33.b.aivencloud.com:24682/defaultdb"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"connect_timeout": 10})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()