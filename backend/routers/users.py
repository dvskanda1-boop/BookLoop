from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import User, Book, ExchangeRequest
from backend.routers.books import build_book_response

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/{user_id}/public-profile")
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    """Returns public profile information for a student to facilitate trust and exchange matching."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    books = db.query(Book).filter(Book.owner_id == user.id, Book.is_available == True).all()
    completed_exchanges = db.query(ExchangeRequest).filter(
        ((ExchangeRequest.owner_id == user.id) | (ExchangeRequest.requester_id == user.id)),
        ExchangeRequest.status == "COMPLETED"
    ).count()

    return {
        "id": user.id,
        "name": user.name,
        "college": user.college,
        "location": user.location,
        "joined_date": user.created_at.strftime("%B %Y") if user.created_at else "Recently",
        "completed_exchanges": completed_exchanges,
        "available_books_count": len(books),
        "books": [build_book_response(b, db) for b in books]
    }
