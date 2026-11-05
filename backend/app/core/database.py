from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os

# PostgreSQL connection
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Engine create karo with pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=10,           # Max connections in pool
    max_overflow=20,        # Extra connections beyond pool_size
    pool_pre_ping=True,     # Check connection before using
    pool_recycle=3600,      # Recycle connection after 1 hour
    echo=False              # Set True to see SQL queries
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables function
def create_tables():
    from app.models.user import User
    from app.models.image import ImageJob, CreditTransaction
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
