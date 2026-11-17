import json
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc

from backend.models import (
    Book, BookCategory, User, ExchangeRequest, CreditTransaction, UserPreference
)
from backend.config import settings
from backend.services.delivery_estimator import estimate_delivery_details
from backend.services.pricing_ai import calculate_heuristic_price
from backend.services.recommendations import serialize_book_card

def search_books_db(
    db: Session,
    query: str = "",
    category: Optional[str] = None,
    condition: Optional[str] = None,
    max_price: Optional[float] = None,
    available_only: bool = True
) -> Dict[str, Any]:
    """Search the actual database for second-hand books matching title, author, category, condition, or budget.
    
    Args:
        db: Database session.
        query: Keywords for title, author, or subject.
        category: Optional category name.
        condition: Optional condition filter ('Like New', 'Very Good', 'Good', 'Acceptable').
        max_price: Optional maximum budget in INR (e.g. 200, 350).
        available_only: If True, only returns books currently available for purchase/exchange.
    """
    q = db.query(Book)
    if available_only:
        q = q.filter(Book.is_available == True, Book.is_sold == False)

    if query:
        search_pattern = f"%{query}%"
        q = q.filter(
            or_(
                Book.title.ilike(search_pattern),
                Book.author.ilike(search_pattern),
                Book.description.ilike(search_pattern)
            )
        )

    if category:
        cat_rec = db.query(BookCategory).filter(BookCategory.name.ilike(f"%{category}%")).first()
        if cat_rec:
            q = q.filter(Book.category_id == cat_rec.id)

    if condition and condition != "All":
        q = q.filter(Book.condition.ilike(f"%{condition}%"))

    if max_price is not None:
        q = q.filter(Book.selling_price <= max_price)

    books = q.order_by(Book.selling_price.asc()).limit(8).all()
    results = [serialize_book_card(b, db) for b in books]

    return {
        "status": "success",
        "count": len(results),
        "books": results,
        "message": f"Found {len(results)} second-hand books matching your criteria." if results else "No books found matching criteria."
    }


def find_books_by_budget_db(db: Session, max_price: float = 200.0) -> Dict[str, Any]:
    """Find available second-hand books under a specific price budget in INR.
    
    Args:
        db: Database session.
        max_price: Maximum price ceiling in INR (e.g. 100, 200, 300).
    """
    books = db.query(Book).filter(
        Book.is_available == True,
        Book.is_sold == False,
        Book.selling_price <= max_price
    ).order_by(Book.selling_price.asc()).limit(6).all()

    results = [serialize_book_card(b, db) for b in books]
    return {
        "status": "success",
        "budget_inr": max_price,
        "count": len(results),
        "books": results,
        "message": f"Found {len(results)} books under ₹{max_price:.0f}."
    }


def get_resale_price_advice_db(
    title: str,
    original_price: float,
    condition: str = "Good",
    publication_year: Optional[int] = 2021
) -> Dict[str, Any]:
    """Calculate fair AI resale price range for a seller based on condition and MRP.
    
    Args:
        title: Title of the book.
        original_price: Original MRP in INR.
        condition: Book condition ('Like New', 'Very Good', 'Good', 'Acceptable').
        publication_year: Year of publication.
    """
    calc = calculate_heuristic_price(original_price, condition, publication_year)
    return {
        "status": "success",
        "title": title,
        "original_price": original_price,
        "recommended_price": calc["recommended_price"],
        "suggested_min_price": calc["suggested_min_price"],
        "suggested_max_price": calc["suggested_max_price"],
        "buyer_savings": calc["buyer_savings"],
        "discount_percent": calc["discount_percent"],
        "advice": f"For '{title}' in {condition} condition, we recommend listing at ₹{calc['recommended_price']:.0f} (a {calc['discount_percent']}% discount off ₹{original_price:.0f} MRP). This saves the buyer ₹{calc['buyer_savings']:.0f}!"
    }


def estimate_delivery_db(
    seller_pincode: str = "570001",
    buyer_pincode: str = "560001",
    book_price: float = 300.0,
    db: Optional[Any] = None,
    **kwargs
) -> Dict[str, Any]:
    """Calculate distance, delivery charge, and transit time between seller and buyer PIN codes.
    
    Args:
        seller_pincode: 6-digit origin PIN code.
        buyer_pincode: 6-digit destination PIN code.
        book_price: Price of the book in INR.
    """
    res = estimate_delivery_details(
        seller_pincode=seller_pincode,
        buyer_pincode=buyer_pincode,
        book_price=book_price
    )
    return {
        "status": "success",
        "distance_km": res["distance_km"],
        "delivery_charge": res["delivery_charge"],
        "estimated_days": res["estimated_days"],
        "seller_city": res["seller_city"],
        "buyer_city": res["buyer_city"],
        "total_payable": res["total_payable"],
        "summary": f"Distance: {res['distance_km']} km ({res['seller_city']} -> {res['buyer_city']}). Estimated delivery charge: ₹{res['delivery_charge']:.0f} ({res['estimated_days']})."
    }


def get_book_details_db(db: Session, book_id_or_title: str) -> Dict[str, Any]:
    """Retrieve full details of a specific book by ID or exact/approximate title.
    
    Args:
        db: Database session.
        book_id_or_title: Numeric ID or book title.
    """
    book = None
    if book_id_or_title.isdigit():
        book = db.query(Book).filter(Book.id == int(book_id_or_title)).first()
    
    if not book:
        book = db.query(Book).filter(Book.title.ilike(f"%{book_id_or_title}%")).first()

    if not book:
        return {"status": "error", "message": f"Book '{book_id_or_title}' was not found in the database."}

    return {
        "status": "success",
        "book": serialize_book_card(book, db)
    }


def recommend_books_db(
    db: Session,
    user_id: Optional[int] = None,
    category: Optional[str] = None,
    limit: int = 5
) -> Dict[str, Any]:
    """Recommend available pre-owned books based on user reading preferences or category.
    
    Args:
        db: Database session.
        user_id: Optional authenticated user ID.
        category: Optional category preference.
        limit: Number of recommendations.
    """
    q = db.query(Book).filter(Book.is_available == True, Book.is_sold == False)
    if user_id:
        q = q.filter(Book.owner_id != user_id)

    if category:
        cat_rec = db.query(BookCategory).filter(BookCategory.name.ilike(f"%{category}%")).first()
        if cat_rec:
            q = q.filter(Book.category_id == cat_rec.id)

    books = q.order_by(desc(Book.discount_percent)).limit(limit).all()
    results = [serialize_book_card(b, db) for b in books]

    return {
        "status": "success",
        "count": len(results),
        "recommendations": results
    }


def check_user_credits_db(db: Session, user_id: Optional[int]) -> Dict[str, Any]:
    """Check the real authenticated user's credit wallet balance.
    
    Args:
        db: Database session.
        user_id: Authenticated student ID.
    """
    if not user_id:
        return {
            "status": "unauthenticated",
            "message": "User is not logged in. Please log in to check your credits."
        }

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"status": "error", "message": "User record not found."}

    return {
        "status": "success",
        "user_name": user.name,
        "credit_balance": user.credit_balance,
        "message": f"You currently have {user.credit_balance} exchange credits in your wallet."
    }


def get_my_books_db(db: Session, user_id: Optional[int]) -> Dict[str, Any]:
    """Retrieve all books listed for sale by the authenticated student.
    
    Args:
        db: Database session.
        user_id: Authenticated student ID.
    """
    if not user_id:
        return {"status": "unauthenticated", "message": "Please log in to view your listings."}

    books = db.query(Book).filter(Book.owner_id == user_id).order_by(desc(Book.created_at)).all()
    results = [serialize_book_card(b, db) for b in books]

    return {
        "status": "success",
        "count": len(results),
        "books": results
    }


def create_exchange_request_db(
    db: Session,
    requester_id: Optional[int],
    requested_book_id: int,
    notes: Optional[str] = "Exchange request via BookLoop AI"
) -> Dict[str, Any]:
    """Initiate a peer-to-peer exchange request using 2 credits.
    
    Args:
        db: Database session.
        requester_id: Authenticated requester ID.
        requested_book_id: ID of the book being requested.
        notes: Message or exchange notes.
    """
    if not requester_id:
        return {"status": "unauthenticated", "message": "Please log in to request an exchange."}

    requester = db.query(User).filter(User.id == requester_id).first()
    if not requester:
        return {"status": "error", "message": "User not found."}

    if requester.credit_balance < 2:
        return {"status": "error", "message": f"Insufficient credits! You have {requester.credit_balance} credits, but 2 are required."}

    book = db.query(Book).filter(Book.id == requested_book_id).first()
    if not book:
        return {"status": "error", "message": "Book not found."}

    if book.owner_id == requester_id:
        return {"status": "error", "message": "You cannot request your own book."}

    if not book.is_available:
        return {"status": "error", "message": "Book is currently unavailable."}

    requester.credit_balance -= 2
    db.commit()

    new_req = ExchangeRequest(
        requester_id=requester_id,
        owner_id=book.owner_id,
        requested_book_id=requested_book_id,
        status="PENDING",
        notes=notes,
        credits_transferred=2
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    return {
        "status": "success",
        "exchange_id": new_req.id,
        "message": f"Exchange request #{new_req.id} created for '{book.title}'. 2 credits placed in escrow."
    }


def get_exchange_status_db(db: Session, exchange_id: int, user_id: Optional[int] = None) -> Dict[str, Any]:
    """Retrieve status of an exchange request."""
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == exchange_id).first()
    if not req:
        return {"status": "error", "message": f"Exchange #{exchange_id} not found."}
    return {
        "status": "success",
        "exchange_id": req.id,
        "exchange_status": req.status
    }


def search_by_category_db(db: Session, category_name: str) -> Dict[str, Any]:
    """Search available books under a specific category."""
    cat = db.query(BookCategory).filter(BookCategory.name.ilike(f"%{category_name}%")).first()
    if not cat:
        return {"status": "not_found", "message": f"Category '{category_name}' not found."}

    books = db.query(Book).filter(
        Book.category_id == cat.id,
        Book.is_available == True,
        Book.is_sold == False
    ).order_by(Book.selling_price.asc()).limit(6).all()

    results = [serialize_book_card(b, db) for b in books]
    return {
        "status": "success",
        "category": cat.name,
        "count": len(results),
        "books": results
    }
