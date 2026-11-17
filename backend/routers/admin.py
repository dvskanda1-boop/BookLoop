from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import (
    User, Book, Order, DeliveryRateRule, ReportedListing, ExchangeRequest, CreditTransaction
)
from backend.schemas import (
    PlatformStats, UserResponse, OrderResponse, DeliveryRateRuleUpdate
)
from backend.auth import get_current_admin
from backend.routers.orders import build_order_response
from backend.config import settings

router = APIRouter(prefix="/api/admin", tags=["Admin Command Hub"])

@router.get("/stats", response_model=PlatformStats)
def get_platform_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Provides key operational metrics, marketplace sales, and platform statistics."""
    total_users = db.query(User).count()
    total_books = db.query(Book).count()
    available_books = db.query(Book).filter(Book.is_available == True, Book.is_sold == False).count()
    sold_books = db.query(Book).filter(Book.is_sold == True).count()
    
    total_orders = db.query(Order).count()
    completed_orders = db.query(Order).filter(Order.status == "DELIVERED").count()
    orders = db.query(Order).all()
    total_gmv = sum(o.total_amount for o in orders)

    total_exchanges = db.query(ExchangeRequest).count()
    completed_exchanges = db.query(ExchangeRequest).filter(ExchangeRequest.status == "COMPLETED").count()
    circulating_credits = sum(u.credit_balance for u in db.query(User).all())

    return {
        "total_users": total_users,
        "total_books": total_books,
        "available_books": available_books,
        "sold_books": sold_books,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_gmv_inr": round(total_gmv, 2),
        "total_exchanges": total_exchanges,
        "completed_exchanges": completed_exchanges,
        "total_credits_circulating": circulating_credits
    }


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns all registered users with seller ratings and balances."""
    return db.query(User).order_by(desc(User.created_at)).all()


@router.get("/orders", response_model=List[OrderResponse])
def get_all_orders(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Returns all marketplace orders across BookLoop AI."""
    orders = db.query(Order).order_by(desc(Order.created_at)).all()
    return [build_order_response(o, db) for o in orders]


@router.get("/delivery-rules")
def get_delivery_rules(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Fetches active delivery rate calculation rules."""
    rule = db.query(DeliveryRateRule).filter(DeliveryRateRule.is_active == True).first()
    if not rule:
        rule = DeliveryRateRule(
            base_fee=settings.DEFAULT_BASE_DELIVERY_FEE,
            base_km_allowance=15.0,
            per_km_rate=settings.DEFAULT_PER_KM_RATE,
            per_250g_rate=settings.DEFAULT_PER_250G_RATE,
            min_delivery_charge=settings.DEFAULT_MIN_DELIVERY_CHARGE,
            free_delivery_threshold=settings.DEFAULT_FREE_DELIVERY_THRESHOLD
        )
        db.add(rule)
        db.commit()
        db.refresh(rule)
    return rule


@router.put("/delivery-rules")
def update_delivery_rules(
    update_in: DeliveryRateRuleUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Allows an administrator to adjust delivery courier charges and free-delivery thresholds."""
    rule = db.query(DeliveryRateRule).filter(DeliveryRateRule.is_active == True).first()
    if not rule:
        rule = DeliveryRateRule()
        db.add(rule)

    for field, val in update_in.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(rule, field, val)

    db.commit()
    db.refresh(rule)
    return {"message": "Delivery rate configuration updated successfully.", "rules": rule}


@router.post("/users/{user_id}/credits")
def adjust_user_credits(
    user_id: int,
    amount: int,
    reason: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Allows an administrator to manually adjust student credits with an audit trail."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    new_balance = user.credit_balance + amount
    if new_balance < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot reduce balance below 0 credits.")

    user.credit_balance = new_balance
    db.commit()
    db.refresh(user)

    tx = CreditTransaction(
        user_id=user.id,
        amount=amount,
        balance_after=new_balance,
        transaction_type="ADMIN_ADJUSTMENT",
        description=f"Admin Adjustment: {reason}"
    )
    db.add(tx)
    db.commit()

    return {
        "message": f"Successfully adjusted user {user.name}'s credits by {amount}.",
        "new_balance": new_balance
    }
