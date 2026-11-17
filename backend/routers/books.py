from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc

from backend.database import get_db
from backend.models import (
    Book, BookCategory, User, ExchangeRequest, UserReadingHistory
)
from backend.schemas import (
    BookCreate, BookUpdate, BookResponse, BookCategoryResponse
)
from backend.auth import get_current_user, get_optional_current_user
from backend.services.recommendations import (
    serialize_book_card, get_best_deals, get_books_by_budget,
    get_books_near_location, get_similar_books
)

# Backward-compatibility alias
build_book_response = serialize_book_card

router = APIRouter(prefix="/api/books", tags=["Books & Second-Hand Marketplace"])

@router.get("/categories", response_model=List[BookCategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Fetches all book categories available on BookLoop AI."""
    return db.query(BookCategory).order_by(BookCategory.name).all()


@router.get("", response_model=List[BookResponse])
def get_books(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    condition: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_discount: Optional[float] = None,
    sort_by: Optional[str] = "newest",  # 'newest', 'price_asc', 'price_desc', 'discount_desc', 'popular'
    available_only: bool = True,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Retrieves marketplace second-hand books with comprehensive search, category, condition, price, and discount filters."""
    q = db.query(Book)
    if available_only:
        q = q.filter(Book.is_available == True, Book.is_sold == False)

    if search and isinstance(search, str) and search.strip():
        search_pattern = f"%{search.strip()}%"
        q = q.filter(
            or_(
                Book.title.ilike(search_pattern),
                Book.author.ilike(search_pattern),
                Book.description.ilike(search_pattern),
                Book.isbn.ilike(search_pattern)
            )
        )

    if category_id and isinstance(category_id, int):
        q = q.filter(Book.category_id == category_id)

    if condition and isinstance(condition, str) and condition != "All":
        q = q.filter(Book.condition.ilike(f"%{condition.strip()}%"))

    if min_price is not None:
        q = q.filter(Book.selling_price >= min_price)

    if max_price is not None:
        q = q.filter(Book.selling_price <= max_price)

    if min_discount is not None:
        q = q.filter(Book.discount_percent >= min_discount)

    # Sorting
    if sort_by == "price_asc":
        q = q.order_by(Book.selling_price.asc())
    elif sort_by == "price_desc":
        q = q.order_by(Book.selling_price.desc())
    elif sort_by == "discount_desc":
        q = q.order_by(Book.discount_percent.desc())
    elif sort_by == "popular":
        q = q.order_by(desc(Book.views_count), desc(Book.exchange_count))
    else:
        q = q.order_by(desc(Book.created_at))

    books = q.offset(offset).limit(limit).all()
    return [serialize_book_card(b, db) for b in books]


@router.get("/curated/deals", response_model=List[BookResponse])
def get_curated_deals(
    min_discount: float = 40.0,
    limit: int = 8,
    db: Session = Depends(get_db)
):
    """Returns top pre-owned books with massive discounts (40%+ off MRP)."""
    return get_best_deals(db=db, min_discount=min_discount, limit=limit)


@router.get("/curated/budget", response_model=List[BookResponse])
def get_curated_budget_books(
    max_price: float = 200.0,
    limit: int = 8,
    db: Session = Depends(get_db)
):
    """Returns ultra-affordable student books under ₹100 or ₹200."""
    return get_books_by_budget(db=db, max_price=max_price, limit=limit)


@router.get("/curated/nearby", response_model=List[BookResponse])
def get_curated_nearby_books(
    pincode: str = "560001",
    max_distance_km: float = 150.0,
    limit: int = 8,
    db: Session = Depends(get_db)
):
    """Finds second-hand books located close to the buyer's campus or PIN code."""
    return get_books_near_location(db=db, buyer_pincode=pincode, max_distance_km=max_distance_km, limit=limit)


@router.get("/my/bookshelf", response_model=List[BookResponse])
def get_my_bookshelf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all books listed by the authenticated student."""
    books = db.query(Book).filter(Book.owner_id == current_user.id).order_by(desc(Book.created_at)).all()
    return [serialize_book_card(b, db) for b in books]


@router.get("/{book_id}", response_model=BookResponse)
def get_book_details(
    book_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Fetches full details for a specific book listing and tracks view counts."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book #{book_id} not found."
        )

    # Increment view counter
    book.views_count = (book.views_count or 0) + 1

    # Log to reading/view history if user is logged in
    if current_user and isinstance(current_user, User):
        history = UserReadingHistory(
            user_id=current_user.id,
            book_id=book.id,
            action_type="VIEW"
        )
        db.add(history)

    db.commit()
    db.refresh(book)

    return serialize_book_card(book, db)


@router.get("/{book_id}/similar", response_model=List[BookResponse])
def get_similar_books_endpoint(book_id: int, db: Session = Depends(get_db)):
    """Returns comparable books for the product details page."""
    return get_similar_books(db=db, book_id=book_id, limit=4)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists a pre-owned book for sale. Enforces rule: Selling price must be strictly lower than MRP."""
    # Pricing validation: Must be lower than MRP
    if book_in.selling_price >= book_in.original_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pricing! As a second-hand marketplace, selling price (₹{book_in.selling_price:.0f}) must be strictly lower than original MRP (₹{book_in.original_price:.0f})."
        )

    # Verify category
    cat = db.query(BookCategory).filter(BookCategory.id == book_in.category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified category ID does not exist."
        )

    # Calculate discount percentage
    discount_pct = round(((book_in.original_price - book_in.selling_price) / book_in.original_price) * 100.0, 1)

    new_book = Book(
        title=book_in.title.strip(),
        author=book_in.author.strip(),
        isbn=book_in.isbn.strip() if book_in.isbn else None,
        description=book_in.description.strip() if book_in.description else None,
        category_id=book_in.category_id,
        condition=book_in.condition,
        original_price=book_in.original_price,
        selling_price=book_in.selling_price,
        discount_percent=discount_pct,
        edition=book_in.edition or "Standard Edition",
        publication_year=book_in.publication_year or 2021,
        pages=book_in.pages or 300,
        language=book_in.language,
        weight_grams=book_in.weight_grams or 450,
        pickup_pincode=book_in.pickup_pincode or current_user.pincode or "560001",
        pickup_city=book_in.pickup_city or current_user.city or "Bengaluru",
        pickup_state=book_in.pickup_state or "Karnataka",
        pickup_location_desc=book_in.pickup_location_desc or current_user.location or "Campus",
        image_url=book_in.image_url or "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
        is_available=True,
        is_sold=False,
        owner_id=current_user.id
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return serialize_book_card(new_book, db)


@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_update: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates an existing book listing. Only the owner or an admin can modify."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    if book.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this book."
        )

    update_dict = book_update.model_dump(exclude_unset=True)
    
    # Re-calculate discount if prices updated
    orig = update_dict.get("original_price", book.original_price)
    sell = update_dict.get("selling_price", book.selling_price)
    if sell >= orig:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selling price must remain strictly lower than original MRP."
        )
    update_dict["discount_percent"] = round(((orig - sell) / orig) * 100.0, 1)

    for field, val in update_dict.items():
        setattr(book, field, val)

    db.commit()
    db.refresh(book)
    return serialize_book_card(book, db)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Removes a book listing. Only owner or admin can delete."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    if book.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    db.delete(book)
    db.commit()
    return None
