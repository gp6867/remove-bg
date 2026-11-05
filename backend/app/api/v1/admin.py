from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_admin_user
from app.core.database import get_db
from app.models.user import User

# Create router
router = APIRouter()

@router.get("/users")
async def get_all_users(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users - Admin only"""
    
    users = db.query(User).all()
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "full_name": u.full_name,
                "credits": u.credits,
                "is_admin": u.is_admin,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ],
        "total": len(users)
    }

@router.post("/add-credits/{user_id}")
async def add_credits(
    user_id: int,
    amount: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Add credits to user - Admin only"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.credits += amount
    db.commit()
    
    return {
        "success": True,
        "user_id": user_id,
        "credits_added": amount,
        "total_credits": user.credits
    }

@router.get("/stats")
async def get_admin_stats(admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Get platform statistics - Admin only"""
    
    total_users = db.query(User).count()
    total_credits = db.query(User).with_entities(User.credits).all()
    total_credits_sum = sum(c[0] for c in total_credits if c[0])
    
    return {
        "total_users": total_users,
        "total_credits_in_system": total_credits_sum,
        "admin_email": admin.email
    }
