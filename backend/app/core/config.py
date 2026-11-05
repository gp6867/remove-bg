from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Image Platform"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://ai_user:ramrajyam80!@localhost:5432/ai_image_db"
    
    # JWT
    SECRET_KEY: str = "my-super-secret-key-ramrajyam-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Storage
    STORAGE_PATH: str = "./storage"
    
    # Email Configuration (Add these)
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    
    # Social Auth (Add these)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    APPLE_CLIENT_ID: str = ""
    APPLE_CLIENT_SECRET: str = ""
    
    # Payment (Add these)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    STRIPE_SECRET_KEY: str = ""
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5174"
    
    # Operation costs
    OPERATION_COSTS: dict = {
        "remove_bg": 1,
        "upscale_2x": 2,
        "upscale_4x": 3,
        "face_enhance": 2,
        "generate_image": 5,
        "enhance_generation": 2
    }
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # This ignores extra fields in .env

settings = Settings()
