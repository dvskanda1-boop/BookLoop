from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import User, CreditTransaction
from backend.schemas import CreditBalanceResponse, CreditTransactionResponse
from backend.auth import get_current_user

router = APIRouter(prefix="/api/credits", tags=["Credits"])

@router.get("/balance", response_model=CreditBalanceResponse)
def get_credit_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves authenticated student's credit balance, earning/spending totals, and recent audit records."""
    txs = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id
    ).order_by(desc(CreditTransaction.created_at)).all()

    total_earned = sum(t.amount for t in txs if t.amount > 0)
    total_spent = abs(sum(t.amount for t in txs if t.amount < 0))

    return {
        "credit_balance": current_user.credit_balance,
        "total_earned": total_earned,
        "total_spent": total_spent,
        "transactions": txs
    }


@router.get("/transactions", response_model=List[CreditTransactionResponse])
def get_transactions(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns detailed history of credit transactions for the user."""
    return db.query(CreditTransaction).filter(
        CreditTransaction.user_id == current_user.id
    ).order_by(desc(CreditTransaction.created_at)).offset(offset).limit(limit).all()
