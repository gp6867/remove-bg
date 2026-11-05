from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.core.database import get_db
from app.models.user import User, PasswordReset, EmailVerification
from app.core.config import settings
from app.core.deps import get_current_user
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
from authlib.integrations.starlette_client import OAuth
from starlette.responses import HTMLResponse

# ============ CREATE ROUTER ============
router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ============ OAuth Setup for Google ============
oauth = OAuth()

oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# ============ Pydantic Models ============
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    credits: int

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

class SendVerificationRequest(BaseModel):
    email: EmailStr

# ============ Helper Functions ============
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# FIXED: Convert sub to string
def create_access_token(data: dict):
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

async def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

# ============ Auth Endpoints ============

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        credits=10,
        email_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email,
        credits=new_user.credits
    )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.id})
    user.last_login = datetime.utcnow()
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        credits=user.credits
    )

@router.get("/me")
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        user_id = int(user_id_str) if user_id_str else None
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "credits": user.credits,
            "is_admin": user.is_admin,
            "total_processed": user.total_processed,
            "email_verified": user.email_verified
        }
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ Forgot Password Endpoints ============

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return {"message": "If email exists, OTP has been sent"}
    
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    db.query(PasswordReset).filter(
        PasswordReset.email == request.email,
        PasswordReset.is_used == False
    ).delete()
    
    reset_entry = PasswordReset(
        email=request.email,
        otp=otp,
        expires_at=expires_at,
        is_used=False
    )
    db.add(reset_entry)
    db.commit()
    
    email_body = f"""
    <html>
    <body>
        <h2>Password Reset Request</h2>
        <p>Your OTP is: <strong>{otp}</strong></p>
        <p>Valid for 15 minutes.</p>
    </body>
    </html>
    """
    
    await send_email(request.email, "Password Reset OTP", email_body)
    return {"message": "OTP sent to your email"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(request.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    
    reset_entry = db.query(PasswordReset).filter(
        PasswordReset.email == request.email,
        PasswordReset.otp == request.otp,
        PasswordReset.is_used == False,
        PasswordReset.expires_at > datetime.utcnow()
    ).first()
    
    if not reset_entry:
        raise HTTPException(400, "Invalid or expired OTP")
    
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    user.hashed_password = get_password_hash(request.new_password)
    reset_entry.is_used = True
    db.commit()
    
    return {"message": "Password reset successful"}

# ============ Email Verification Endpoints ============

@router.post("/send-verification-otp")
async def send_verification_otp(request: SendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    if user.email_verified:
        return {"message": "Email already verified"}
    
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.is_verified == False
    ).delete()
    
    verification = EmailVerification(
        user_id=user.id,
        otp=otp,
        expires_at=expires_at,
        is_verified=False
    )
    db.add(verification)
    db.commit()
    
    email_body = f"""
    <html>
    <body>
        <h2>Verify Your Email</h2>
        <p>Your verification OTP is: <strong>{otp}</strong></p>
        <p>Valid for 15 minutes.</p>
    </body>
    </html>
    """
    
    await send_email(request.email, "Verify Your Email", email_body)
    return {"message": "Verification OTP sent"}

@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    verification = db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.otp == request.otp,
        EmailVerification.is_verified == False,
        EmailVerification.expires_at > datetime.utcnow()
    ).first()
    
    if not verification:
        raise HTTPException(400, "Invalid or expired OTP")
    
    verification.is_verified = True
    user.email_verified = True
    db.commit()
    
    return {"message": "Email verified successfully"}

# ============ Google OAuth Endpoints ============

@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            resp = await oauth.google.get('https://www.googleapis.com/oauth2/v1/userinfo', token=token)
            user_info = resp.json()
        
        email = user_info.get('email')
        full_name = user_info.get('name', email.split('@')[0])
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=secrets.token_urlsafe(32),
                credits=20,
                is_active=True,
                email_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token = create_access_token(data={"sub": user.id})
        
        return HTMLResponse(f"""
        <!DOCTYPE html>
        <html>
        <head><title>Login Success</title></head>
        <body>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'google_login_success',
                        token: '{access_token}',
                        user: {{
                            id: {user.id},
                            email: '{user.email}',
                            name: '{user.full_name}',
                            credits: {user.credits}
                        }}
                    }}, '*');
                    window.close();
                }} else {{
                    window.location.href = '{settings.FRONTEND_URL}/dashboard?token={access_token}';
                }}
            </script>
            <h2>Login Successful! Redirecting...</h2>
        </body>
        </html>
        """)
    except Exception as e:
        return HTMLResponse(f"""
        <html>
        <body>
            <h2>Login Failed: {str(e)}</h2>
            <script>setTimeout(() => window.close(), 3000);</script>
        </body>
        </html>
        """)

# ============ Apple OAuth Setup ============
oauth.register(
    name='apple',
    client_id=settings.APPLE_CLIENT_ID,
    client_secret=settings.APPLE_CLIENT_SECRET,
    server_metadata_url='https://appleid.apple.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email name'}
)

@router.get("/apple/login")
async def apple_login(request: Request):
    redirect_uri = request.url_for('apple_callback')
    return await oauth.apple.authorize_redirect(request, redirect_uri)

@router.get("/apple/callback")
async def apple_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.apple.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        email = user_info.get('email')
        full_name = user_info.get('name', email.split('@')[0])
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=secrets.token_urlsafe(32),
                credits=20,
                is_active=True,
                email_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token = create_access_token(data={"sub": user.id})
        
        return HTMLResponse(f"""
        <!DOCTYPE html>
        <html>
        <head><title>Login Success</title></head>
        <body>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'apple_login_success',
                        token: '{access_token}',
                        user: {{
                            id: {user.id},
                            email: '{user.email}',
                            name: '{user.full_name}',
                            credits: {user.credits}
                        }}
                    }}, '*');
                    window.close();
                }} else {{
                    window.location.href = '{settings.FRONTEND_URL}/dashboard?token={access_token}';
                }}
            </script>
            <h2>Login Successful! Redirecting...</h2>
        </body>
        </html>
        """)
    except Exception as e:
        return HTMLResponse(f"""
        <html>
        <body>
            <h2>Login Failed: {str(e)}</h2>
            <script>setTimeout(() => window.close(), 3000);</script>
        </body>
        </html>
        """)

# ============ Profile Management Endpoints ============

@router.put("/update-profile")
async def update_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    body = await request.json()
    full_name = body.get("full_name")
    
    if not full_name:
        raise HTTPException(400, "Full name is required")
    
    current_user.full_name = full_name
    db.commit()
    
    return {
        "success": True,
        "full_name": current_user.full_name,
        "message": "Profile updated successfully"
    }

@router.post("/change-password")
async def change_password(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    body = await request.json()
    old_password = body.get("old_password")
    new_password = body.get("new_password")
    
    if not old_password or not new_password:
        raise HTTPException(400, "Old and new password are required")
    
    if len(new_password) < 6:
        raise HTTPException(400, "New password must be at least 6 characters")
    
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(400, "Old password is incorrect")
    
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"success": True, "message": "Password changed successfully"}

@router.delete("/delete-account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    
    return {"success": True, "message": "Account deleted successfully"}
