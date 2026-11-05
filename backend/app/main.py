from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session
from app.core.database import engine, Base, get_db
from app.core.config import settings
import os

from app.models.user import User, ImageJob, CreditTransaction, PasswordReset, EmailVerification

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

# ✅ Serve static files
os.makedirs("./storage", exist_ok=True)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1 import auth, image, generation, payment, admin

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(image.router, prefix="/api/v1/image", tags=["Image Processing"])
app.include_router(generation.router, prefix="/api/v1/generate", tags=["AI Generation"])
app.include_router(payment.router, prefix="/api/v1/payment", tags=["Payment"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "status": "running",
        "database": "PostgreSQL"
    }

@app.get("/health")
async def health(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

