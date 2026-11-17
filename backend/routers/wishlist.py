from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import Wishlist, Book, User
from backend.schemas import WishlistResponse, BookResponse
from backend.auth import get_current_user
from backend.services.recommendations import serialize_book_card

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

@router.post("/toggle/{book_id}")
def toggle_wishlist(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggles book in the student's saved wishlist."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    existing = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.book_id == book_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"is_wishlisted": False, "message": f"Removed '{book.title}' from your wishlist."}
    else:
        new_item = Wishlist(user_id=current_user.id, book_id=book_id)
        db.add(new_item)
        db.commit()
        return {"is_wishlisted": True, "message": f"Added '{book.title}' to your wishlist!"}


@router.get("", response_model=List[WishlistResponse])
def get_user_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all books saved in current user's wishlist."""
    items = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id
    ).order_by(desc(Wishlist.created_at)).all()

    results = []
    for item in items:
        book = db.query(Book).filter(Book.id == item.book_id).first()
        results.append({
            "id": item.id,
            "book_id": item.book_id,
            "book": serialize_book_card(book, db) if book else None,
            "created_at": item.created_at
        })
    return results
