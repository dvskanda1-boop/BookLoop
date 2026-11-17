import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.models import (
    Book, BookCategory, User, Order, Wishlist, UserReadingHistory, UserPreference
)
from backend.services.delivery_estimator import lookup_pincode_coordinates, calculate_haversine_distance

def serialize_book_card(b: Book, db: Session, reason: Optional[str] = None) -> Dict[str, Any]:
    cat = db.query(BookCategory).filter(BookCategory.id == b.category_id).first()
    owner = db.query(User).filter(User.id == b.owner_id).first()
    
    return {
        "id": b.id,
        "title": b.title,
        "author": b.author,
        "isbn": b.isbn,
        "description": b.description,
        "category_id": b.category_id,
        "category_name": cat.name if cat else "General",
        "condition": b.condition,
        "language": b.language,
        "image_url": b.image_url,
        "original_price": b.original_price,
        "selling_price": b.selling_price,
        "discount_percent": b.discount_percent,
        "buyer_savings": round(b.original_price - b.selling_price, 2),
        "edition": b.edition,
        "publication_year": b.publication_year,
        "pages": b.pages,
        "weight_grams": b.weight_grams,
        "pickup_pincode": b.pickup_pincode,
        "pickup_city": b.pickup_city,
        "pickup_state": b.pickup_state,
        "pickup_location_desc": b.pickup_location_desc,
        "is_available": b.is_available,
        "is_sold": b.is_sold,
        "owner_id": b.owner_id,
        "owner_name": owner.name if owner else "Student",
        "owner_rating": owner.seller_rating if owner else 4.8,
        "owner_city": owner.city if owner else "Bengaluru",
        "recommendation_reason": reason or "Popular pre-owned listing on campus",
        "created_at": b.created_at or datetime.datetime.now()
    }


def get_personalized_recommendations(
    db: Session,
    user_id: Optional[int] = None,
    limit: int = 8
) -> List[Dict[str, Any]]:
    """Returns tailored second-hand book recommendations based on user interests, purchases, and browsing."""
    q = db.query(Book).filter(Book.is_available == True, Book.is_sold == False)
    
    if user_id:
        # Exclude books owned by user
        q = q.filter(Book.owner_id != user_id)
        user = db.query(User).filter(User.id == user_id).first()
        pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()

        # Check user's preferred categories
        fav_cat_ids = []
        fav_authors = []
        if pref:
            if pref.favorite_categories:
                cats = [c.strip() for c in pref.favorite_categories.split(",") if c.strip()]
                fav_cat_ids = [
                    c.id for c in db.query(BookCategory).filter(
                        or_(*[BookCategory.name.ilike(f"%{c}%") for c in cats])
                    ).all()
                ]
            if pref.favorite_authors:
                fav_authors = [a.strip() for a in pref.favorite_authors.split(",") if a.strip()]

        # Query matching books
        matched = []
        if fav_cat_ids or fav_authors:
            conds = []
            if fav_cat_ids:
                conds.append(Book.category_id.in_(fav_cat_ids))
            if fav_authors:
                conds.append(or_(*[Book.author.ilike(f"%{a}%") for a in fav_authors]))
            
            matched = q.filter(or_(*conds)).order_by(desc(Book.views_count), desc(Book.created_at)).limit(limit).all()

        if matched:
            return [
                serialize_book_card(
                    b, db, reason=f"Matches your reading interest in {b.category_rel.name if b.category_rel else 'Books'}"
                )
                for b in matched
            ]

    # Fallback to top-rated / highly discounted available books
    popular = q.order_by(desc(Book.discount_percent), desc(Book.created_at)).limit(limit).all()
    return [
        serialize_book_card(b, db, reason=f"Top {int(b.discount_percent)}% discount deal on BookLoop")
        for b in popular
    ]


def get_best_deals(db: Session, min_discount: float = 40.0, limit: int = 8) -> List[Dict[str, Any]]:
    """Returns pre-owned books with highest discounts (40%+ off MRP)."""
    books = db.query(Book).filter(
        Book.is_available == True,
        Book.is_sold == False,
        Book.discount_percent >= min_discount
    ).order_by(desc(Book.discount_percent)).limit(limit).all()

    return [
        serialize_book_card(b, db, reason=f"Massive {int(b.discount_percent)}% off MRP — Save ₹{int(b.original_price - b.selling_price)}")
        for b in books
    ]


def get_books_by_budget(db: Session, max_price: float = 200.0, limit: int = 8) -> List[Dict[str, Any]]:
    """Returns affordable books under specified budget (e.g. ₹100 or ₹200)."""
    books = db.query(Book).filter(
        Book.is_available == True,
        Book.is_sold == False,
        Book.selling_price <= max_price
    ).order_by(Book.selling_price.asc()).limit(limit).all()

    return [
        serialize_book_card(b, db, reason=f"Budget pick under ₹{int(max_price)}")
        for b in books
    ]


def get_books_near_location(
    db: Session,
    buyer_pincode: str = "560001",
    max_distance_km: float = 150.0,
    limit: int = 8
) -> List[Dict[str, Any]]:
    """Finds second-hand books located close to the buyer's PIN code."""
    b_lat, b_lon, b_city, b_state = lookup_pincode_coordinates(buyer_pincode)

    books = db.query(Book).filter(
        Book.is_available == True,
        Book.is_sold == False
    ).limit(30).all()

    scored = []
    for b in books:
        s_lat, s_lon, _, _ = lookup_pincode_coordinates(b.pickup_pincode)
        dist = calculate_haversine_distance(s_lat, s_lon, b_lat, b_lon)
        if dist <= max_distance_km:
            scored.append((dist, b))

    # Sort by distance
    scored.sort(key=lambda x: x[0])
    results = []
    for dist, b in scored[:limit]:
        reason = f"Fast {int(dist)} km delivery from {b.pickup_city}"
        card = serialize_book_card(b, db, reason=reason)
        card["estimated_distance_km"] = dist
        results.append(card)

    return results


def get_similar_books(db: Session, book_id: int, limit: int = 4) -> List[Dict[str, Any]]:
    """Returns comparable books in same category or by same author for the product detail page."""
    target = db.query(Book).filter(Book.id == book_id).first()
    if not target:
        return []

    similar = db.query(Book).filter(
        Book.id != target.id,
        Book.is_available == True,
        Book.is_sold == False,
        or_(
            Book.category_id == target.category_id,
            Book.author.ilike(f"%{target.author}%")
        )
    ).limit(limit).all()

    return [
        serialize_book_card(b, db, reason=f"Similar to {target.title} ({b.category_rel.name if b.category_rel else 'Genre'})")
        for b in similar
    ]
