from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import (
    ExchangeRequest, Book, User, CreditTransaction
)
from backend.schemas import (
    ExchangeCreate, ExchangeResponse, BookResponse
)
from backend.auth import get_current_user
from backend.config import settings
from backend.routers.books import build_book_response

router = APIRouter(prefix="/api/exchanges", tags=["Exchanges"])

def build_exchange_response(req: ExchangeRequest, db: Session) -> dict:
    requester = db.query(User).filter(User.id == req.requester_id).first()
    owner = db.query(User).filter(User.id == req.owner_id).first()
    req_book = db.query(Book).filter(Book.id == req.requested_book_id).first()
    off_book = db.query(Book).filter(Book.id == req.offered_book_id).first() if req.offered_book_id else None

    return {
        "id": req.id,
        "requester_id": req.requester_id,
        "requester_name": requester.name if requester else "Student",
        "owner_id": req.owner_id,
        "owner_name": owner.name if owner else "Student",
        "requested_book": build_book_response(req_book, db) if req_book else None,
        "offered_book": build_book_response(off_book, db) if off_book else None,
        "status": req.status,
        "notes": req.notes,
        "credits_transferred": req.credits_transferred,
        "created_at": req.created_at,
        "updated_at": req.updated_at
    }


@router.post("", response_model=ExchangeResponse, status_code=status.HTTP_201_CREATED)
def create_exchange(
    data: ExchangeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new exchange request and holds credits in escrow."""
    # 1. Check credit balance
    if current_user.credit_balance < settings.CREDIT_COST_PER_REQUEST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient exchange credits! You have {current_user.credit_balance} credits, but {settings.CREDIT_COST_PER_REQUEST} credits are needed."
        )

    # 2. Check book validity
    book = db.query(Book).filter(Book.id == data.requested_book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requested book not found.")

    if book.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot request an exchange for a book that you already own!"
        )

    if not book.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The book '{book.title}' is currently unavailable for exchange."
        )

    # 3. Check for existing active request
    existing = db.query(ExchangeRequest).filter(
        ExchangeRequest.requester_id == current_user.id,
        ExchangeRequest.requested_book_id == data.requested_book_id,
        ExchangeRequest.status.in_(["PENDING", "ACCEPTED"])
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an active request (#{existing.id}) for this book."
        )

    # 4. Safely deduct credits from requester
    current_user.credit_balance -= settings.CREDIT_COST_PER_REQUEST
    db.commit()
    db.refresh(current_user)

    # 5. Create Exchange Record
    new_exchange = ExchangeRequest(
        requester_id=current_user.id,
        owner_id=book.owner_id,
        requested_book_id=book.id,
        offered_book_id=data.offered_book_id,
        status="PENDING",
        notes=data.notes or "I would love to exchange and read this book!",
        credits_transferred=settings.CREDIT_COST_PER_REQUEST
    )
    db.add(new_exchange)
    db.commit()
    db.refresh(new_exchange)

    # 6. Audit transaction
    tx = CreditTransaction(
        user_id=current_user.id,
        amount=-settings.CREDIT_COST_PER_REQUEST,
        balance_after=current_user.credit_balance,
        transaction_type="EXCHANGE_SPENT",
        description=f"Exchange request #{new_exchange.id} for '{book.title}'",
        reference_exchange_id=new_exchange.id
    )
    db.add(tx)
    db.commit()

    return build_exchange_response(new_exchange, db)


@router.get("/incoming", response_model=List[ExchangeResponse])
def get_incoming_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns exchange requests received from other students for books owned by current user."""
    reqs = db.query(ExchangeRequest).filter(
        ExchangeRequest.owner_id == current_user.id
    ).order_by(desc(ExchangeRequest.created_at)).all()
    return [build_exchange_response(r, db) for r in reqs]


@router.get("/outgoing", response_model=List[ExchangeResponse])
def get_outgoing_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns exchange requests sent by the current student to other book owners."""
    reqs = db.query(ExchangeRequest).filter(
        ExchangeRequest.requester_id == current_user.id
    ).order_by(desc(ExchangeRequest.created_at)).all()
    return [build_exchange_response(r, db) for r in reqs]


@router.post("/{exchange_id}/accept", response_model=ExchangeResponse)
def accept_exchange(
    exchange_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Owner accepts the exchange request."""
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == exchange_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exchange request not found.")

    if req.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the book owner can accept this request.")

    if req.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot accept exchange with status: {req.status}")

    req.status = "ACCEPTED"
    
    # Mark requested book as temporarily unavailable so other users cannot request it concurrently
    book = db.query(Book).filter(Book.id == req.requested_book_id).first()
    if book:
        book.is_available = False

    db.commit()
    db.refresh(req)
    return build_exchange_response(req, db)


@router.post("/{exchange_id}/reject", response_model=ExchangeResponse)
def reject_exchange(
    exchange_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Owner rejects the exchange request. Held credits are automatically refunded to requester."""
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == exchange_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exchange request not found.")

    if req.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the book owner can reject this request.")

    if req.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot reject exchange with status: {req.status}")

    req.status = "REJECTED"

    # Refund held credits to requester
    requester = db.query(User).filter(User.id == req.requester_id).first()
    if requester:
        requester.credit_balance += settings.CREDIT_COST_PER_REQUEST
        db.commit()
        db.refresh(requester)

        refund_tx = CreditTransaction(
            user_id=requester.id,
            amount=settings.CREDIT_COST_PER_REQUEST,
            balance_after=requester.credit_balance,
            transaction_type="EXCHANGE_REFUND",
            description=f"Refund for rejected exchange request #{req.id}",
            reference_exchange_id=req.id
        )
        db.add(refund_tx)

    db.commit()
    db.refresh(req)
    return build_exchange_response(req, db)


@router.post("/{exchange_id}/cancel", response_model=ExchangeResponse)
def cancel_exchange(
    exchange_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Requester cancels their pending exchange request. Credits are refunded."""
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == exchange_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exchange request not found.")

    if req.requester_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the requester can cancel this request.")

    if req.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel exchange with status: {req.status}")

    req.status = "CANCELLED"

    # Refund held credits
    current_user.credit_balance += settings.CREDIT_COST_PER_REQUEST
    db.commit()
    db.refresh(current_user)

    refund_tx = CreditTransaction(
        user_id=current_user.id,
        amount=settings.CREDIT_COST_PER_REQUEST,
        balance_after=current_user.credit_balance,
        transaction_type="EXCHANGE_REFUND",
        description=f"Refund for cancelled exchange request #{req.id}",
        reference_exchange_id=req.id
    )
    db.add(refund_tx)
    db.commit()
    db.refresh(req)

    return build_exchange_response(req, db)


@router.post("/{exchange_id}/complete", response_model=ExchangeResponse)
def complete_exchange(
    exchange_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Completes the physical handover. Book owner earns the exchange reward credits."""
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == exchange_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exchange request not found.")

    if current_user.id not in [req.requester_id, req.owner_id] and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only exchange participants or admin can mark it complete.")

    if req.status != "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only accepted exchanges can be marked complete. Current status: {req.status}"
        )

    req.status = "COMPLETED"

    # Award reward credits to book owner
    owner = db.query(User).filter(User.id == req.owner_id).first()
    if owner:
        owner.credit_balance += settings.CREDIT_REWARD_PER_EXCHANGE
        db.commit()
        db.refresh(owner)

        earn_tx = CreditTransaction(
            user_id=owner.id,
            amount=settings.CREDIT_REWARD_PER_EXCHANGE,
            balance_after=owner.credit_balance,
            transaction_type="EXCHANGE_EARNED",
            description=f"Reward earned for completing book exchange #{req.id}",
            reference_exchange_id=req.id
        )
        db.add(earn_tx)

    # Increment exchange count
    req_book = db.query(Book).filter(Book.id == req.requested_book_id).first()
    if req_book:
        req_book.exchange_count += 1
        # Optionally transfer ownership or make available again
        req_book.is_available = True

    db.commit()
    db.refresh(req)
    return build_exchange_response(req, db)
