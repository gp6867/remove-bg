from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, CreditTransaction
from app.core.config import settings
import razorpay

router = APIRouter()

# Initialize Razorpay
razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)

# Pricing Plans
CREDIT_PLANS = {
    "plan_basic": {"credits": 200, "price": 1.99, "price_inr": "$1.99", "amount": 199},
    "plan_pro": {"credits": 600, "price": 4.99, "price_inr": "$4.99", "amount": 499},
    "plan_business": {"credits": 2000, "price": 12.99, "price_inr": "$12.99", "amount": 1299},
    "plan_enterprise": {"credits": 10000, "price": 49.99, "price_inr": "$49.99", "amount": 4999},
}

@router.get("/plans")
async def get_plans():
    """Get available credit plans"""
    return {
        "plans": [
            {
                "id": key,
                "credits": value["credits"],
                "price": value["price"],
                "price_inr": f"₹{value['price']}",
                "amount": value["amount"]
            }
            for key, value in CREDIT_PLANS.items()
        ]
    }

@router.post("/create-order")
async def create_order(
    plan_id: str,
    current_user: User = Depends(get_current_user)
):
    """Create Razorpay order for credit purchase"""
    
    if plan_id not in CREDIT_PLANS:
        raise HTTPException(400, "Invalid plan")
    
    plan = CREDIT_PLANS[plan_id]
    
    # Create order
    order_data = {
        'amount': plan["amount"],
        'currency': 'INR',
        'receipt': f'credits_{plan["credits"]}_{current_user.id}',
        'payment_capture': 1
    }
    
    try:
        order = razorpay_client.order.create(data=order_data)
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "credits": plan["credits"],
            "key_id": settings.RAZORPAY_KEY_ID
        }
    except Exception as e:
        raise HTTPException(500, f"Order creation failed: {str(e)}")

@router.post("/verify-payment")
async def verify_payment(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment and add credits"""
    
    body = await request.json()
    
    payment_id = body.get("razorpay_payment_id")
    order_id = body.get("razorpay_order_id")
    signature = body.get("razorpay_signature")
    credits = body.get("credits")
    amount = body.get("amount")
    
    # Verify signature
    params_dict = {
        'razorpay_payment_id': payment_id,
        'razorpay_order_id': order_id,
        'razorpay_signature': signature
    }
    
    try:
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Add credits to user
        current_user.credits += credits
        
        # Record transaction
        transaction = CreditTransaction(
            user_id=current_user.id,
            amount=credits,
            balance_after=current_user.credits,
            description=f"Purchased {credits} credits for ₹{amount/100}",
            payment_id=payment_id,
            payment_method="razorpay"
        )
        db.add(transaction)
        db.commit()
        
        return {
            "success": True,
            "credits": current_user.credits,
            "message": f"{credits} credits added successfully!"
        }
        
    except Exception as e:
        raise HTTPException(400, f"Payment verification failed: {str(e)}")
