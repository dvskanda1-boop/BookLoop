from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import Review, User, Book, Order
from backend.schemas import ReviewCreate, ReviewResponse
from backend.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews & Ratings"])

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows a buyer to review a second-hand seller and book after an order."""
    if review_in.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot submit a review for yourself!"
        )

    # Check verified purchase
    is_verified = False
    if review_in.order_id:
        order = db.query(Order).filter(
            Order.id == review_in.order_id,
            Order.buyer_id == current_user.id
        ).first()
        if order:
            is_verified = True

    new_review = Review(
        book_id=review_in.book_id,
        seller_id=review_in.seller_id,
        buyer_id=current_user.id,
        order_id=review_in.order_id,
        rating=review_in.rating,
        comment=review_in.comment.strip(),
        condition_rating=review_in.condition_rating or "Accurate as described",
        is_verified_purchase=is_verified
    )
    db.add(new_review)

    # Update seller average rating
    seller = db.query(User).filter(User.id == review_in.seller_id).first()
    if seller:
        all_reviews = db.query(Review).filter(Review.seller_id == seller.id).all()
        ratings = [r.rating for r in all_reviews] + [review_in.rating]
        seller.seller_rating = round(sum(ratings) / len(ratings), 1)
        seller.total_ratings = len(ratings)

    db.commit()
    db.refresh(new_review)

    return {
        "id": new_review.id,
        "book_id": new_review.book_id,
        "seller_id": new_review.seller_id,
        "buyer_id": new_review.buyer_id,
        "buyer_name": current_user.name,
        "rating": new_review.rating,
        "comment": new_review.comment,
        "condition_rating": new_review.condition_rating,
        "is_verified_purchase": new_review.is_verified_purchase,
        "created_at": new_review.created_at
    }


@router.get("/seller/{seller_id}", response_model=List[ReviewResponse])
def get_seller_reviews(seller_id: int, db: Session = Depends(get_db)):
    """Returns customer reviews and ratings for a particular seller."""
    reviews = db.query(Review).filter(
        Review.seller_id == seller_id
    ).order_by(desc(Review.created_at)).all()

    results = []
    for r in reviews:
        buyer = db.query(User).filter(User.id == r.buyer_id).first()
        results.append({
            "id": r.id,
            "book_id": r.book_id,
            "seller_id": r.seller_id,
            "buyer_id": r.buyer_id,
            "buyer_name": buyer.name if buyer else "Student Buyer",
            "rating": r.rating,
            "comment": r.comment,
            "condition_rating": r.condition_rating,
            "is_verified_purchase": r.is_verified_purchase,
            "created_at": r.created_at
        })
    return results


@router.get("/book/{book_id}", response_model=List[ReviewResponse])
def get_book_reviews(book_id: int, db: Session = Depends(get_db)):
    """Returns reviews associated with a specific book title or edition."""
    reviews = db.query(Review).filter(
        Review.book_id == book_id
    ).order_by(desc(Review.created_at)).all()

    results = []
    for r in reviews:
        buyer = db.query(User).filter(User.id == r.buyer_id).first()
        results.append({
            "id": r.id,
            "book_id": r.book_id,
            "seller_id": r.seller_id,
            "buyer_id": r.buyer_id,
            "buyer_name": buyer.name if buyer else "Verified Buyer",
            "rating": r.rating,
            "comment": r.comment,
            "condition_rating": r.condition_rating,
            "is_verified_purchase": r.is_verified_purchase,
            "created_at": r.created_at
        })
    return results
