import pytest
from fastapi import HTTPException
from backend.database import SessionLocal
from backend.models import User, Book, ExchangeRequest, CreditTransaction, BookCategory, Order, Wishlist, Review
from backend.routers.auth import login, register
from backend.routers.books import get_books, get_book_details, create_book
from backend.routers.exchanges import (
    create_exchange, accept_exchange, reject_exchange, complete_exchange
)
from backend.routers.orders import create_order, get_my_orders
from backend.routers.wishlist import toggle_wishlist, get_user_wishlist
from backend.routers.reviews import create_review
from backend.routers.admin import get_platform_stats
from backend.schemas import (
    UserLogin, UserRegister, BookCreate, ExchangeCreate, OrderCreate, ReviewCreate
)
from backend.services.delivery_estimator import estimate_delivery_details, lookup_pincode_coordinates
from backend.services.pricing_ai import get_ai_price_recommendation
from backend.services.tools import (
    search_books_db,
    get_book_details_db,
    recommend_books_db,
    check_user_credits_db,
    get_my_books_db,
    search_by_category_db,
    get_exchange_status_db,
    estimate_delivery_db,
    find_books_by_budget_db,
    get_resale_price_advice_db
)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_login_demo_user(db):
    res = login(login_data=UserLogin(email="arjun@college.edu", password="Student@123"), db=db)
    assert res["access_token"] is not None
    assert res["user"].name == "Arjun Sharma"
    assert res["user"].credit_balance >= 10

def test_login_invalid_password(db):
    with pytest.raises(HTTPException) as exc_info:
        login(login_data=UserLogin(email="arjun@college.edu", password="WrongPassword!"), db=db)
    assert exc_info.value.status_code == 401

def test_user_registration(db):
    import uuid
    random_email = f"student_{uuid.uuid4().hex[:6]}@college.edu"
    reg_data = UserRegister(
        name="Test Student",
        email=random_email,
        password="TestPassword@123",
        college="National Institute of Technology",
        location="Hostel 4"
    )
    res = register(user_data=reg_data, db=db)
    assert res["user"].credit_balance == 10
    assert res["access_token"] is not None

def test_get_books_and_search(db):
    all_books = get_books(db=db)
    assert len(all_books) >= 10

    search_books = get_books(search="Data", db=db)
    assert len(search_books) > 0
    assert any("Data" in b["title"] for b in search_books)

def test_book_details(db):
    first_book = db.query(Book).first()
    details = get_book_details(book_id=first_book.id, db=db)
    assert details["title"] == first_book.title
    assert details["owner_name"] is not None

def test_second_hand_pricing_rule_strictly_below_mrp(db):
    """Enforces rule: Selling price must be strictly lower than original retail MRP."""
    user = db.query(User).filter(User.email == "arjun@college.edu").first()
    cat = db.query(BookCategory).first()

    # Attempting to list with selling_price == original_price should fail
    with pytest.raises(HTTPException) as exc:
        create_book(
            book_in=BookCreate(
                title="Test Same Price Book",
                author="Test Author",
                category_id=cat.id,
                condition="Very Good",
                original_price=500.0,
                selling_price=500.0,
                pickup_pincode="560001",
                pickup_city="Bengaluru"
            ),
            current_user=user,
            db=db
        )
    assert "strictly lower than original MRP" in exc.value.detail

    # Attempting to list with selling_price > original_price should fail
    with pytest.raises(HTTPException) as exc2:
        create_book(
            book_in=BookCreate(
                title="Test Higher Price Book",
                author="Test Author",
                category_id=cat.id,
                condition="Very Good",
                original_price=500.0,
                selling_price=550.0,
                pickup_pincode="560001",
                pickup_city="Bengaluru"
            ),
            current_user=user,
            db=db
        )
    assert "strictly lower than original MRP" in exc2.value.detail

def test_distance_based_delivery_estimator():
    """Validates PIN code lookup and distance-based courier delivery fee calculation."""
    # Lookup coordinates
    lat, lon, city, state = lookup_pincode_coordinates("560001")
    assert "Bengaluru" in city

    # Bengaluru (560001) to Mysuru (570001)
    estimate = estimate_delivery_details(
        seller_pincode="560001",
        buyer_pincode="570001",
        weight_grams=450,
        book_price=250.0
    )
    assert estimate["distance_km"] > 0
    assert estimate["delivery_charge"] >= 35.0
    assert "business days" in estimate["estimated_days"]

    # Free delivery threshold test
    free_estimate = estimate_delivery_details(
        seller_pincode="560001",
        buyer_pincode="570001",
        weight_grams=450,
        book_price=900.0
    )
    assert free_estimate["is_free_delivery"] is True
    assert free_estimate["delivery_charge"] == 0.0

def test_ai_resale_pricing_logic(db):
    """Tests deterministic condition depreciation pricing engine."""
    rec = get_ai_price_recommendation(
        title="Operating System Concepts",
        original_price=800.0,
        condition="Very Good",
        author="Silberschatz",
        db=db
    )
    assert rec["recommended_selling_price"] < 800.0
    assert rec["suggested_min_price"] < rec["suggested_max_price"]
    assert rec["suggested_max_price"] < 800.0
    assert "depreciation" in rec["condition_depreciation_analysis"].lower()

def test_order_creation_and_atomic_stock_locking(db):
    """Tests that placing an order locks unique single-item second-hand stock atomically."""
    buyer = db.query(User).filter(User.email == "rohit@college.edu").first()
    assert buyer is not None
    
    # Find an available book not owned by Rohit
    book = db.query(Book).filter(
        Book.owner_id != buyer.id,
        Book.is_available == True,
        Book.is_sold == False
    ).first()
    assert book is not None

    book_id = book.id
    order_in = OrderCreate(
        book_id=book_id,
        recipient_name="Rohit Verma",
        recipient_phone="9876543212",
        shipping_address="Hostel 2, Room 101, Campus Road",
        buyer_city="Bengaluru",
        buyer_state="Karnataka",
        buyer_pincode="560001",
        payment_method="CASH_ON_DELIVERY"
    )

    created_order = create_order(order_in=order_in, current_user=buyer, db=db)
    assert created_order["order_number"].startswith("BL-")
    assert created_order["tracking_number"].startswith("TRK-")
    assert created_order["status"] == "CONFIRMED"

    # Verify book is now locked and sold
    refreshed_book = db.query(Book).filter(Book.id == book_id).first()
    assert refreshed_book.is_sold is True
    assert refreshed_book.is_available is False

    # Attempting to order the same copy again must raise HTTP 400
    with pytest.raises(HTTPException) as exc:
        create_order(order_in=order_in, current_user=buyer, db=db)
    assert "already been sold or is unavailable" in exc.value.detail

def test_wishlist_toggle(db):
    """Tests adding and removing books from user's wishlist."""
    user = db.query(User).filter(User.email == "arjun@college.edu").first()
    book = db.query(Book).first()

    # Toggle 1: Add to wishlist
    res1 = toggle_wishlist(book_id=book.id, current_user=user, db=db)
    assert res1["is_wishlisted"] is True

    # Check wishlist items
    items = get_user_wishlist(current_user=user, db=db)
    assert any(i["book_id"] == book.id for i in items)

    # Toggle 2: Remove from wishlist
    res2 = toggle_wishlist(book_id=book.id, current_user=user, db=db)
    assert res2["is_wishlisted"] is False

def test_verified_buyer_review(db):
    """Tests submitting a verified review and updating seller's average rating."""
    buyer = db.query(User).filter(User.email == "priya@college.edu").first()
    seller = db.query(User).filter(User.email == "arjun@college.edu").first()
    book = db.query(Book).filter(Book.owner_id == seller.id).first()

    rev_in = ReviewCreate(
        book_id=book.id,
        seller_id=seller.id,
        rating=5,
        comment="Book was in pristine condition. Exactly as described!",
        condition_rating="Accurate as described"
    )
    rev = create_review(review_in=rev_in, current_user=buyer, db=db)
    assert rev["rating"] == 5
    assert rev["buyer_name"] == buyer.name

    # Check seller rating was updated
    refreshed_seller = db.query(User).filter(User.id == seller.id).first()
    assert refreshed_seller.seller_rating > 0

def test_ai_agent_tools(db):
    # 1. Search tool
    search_out = search_books_db(db=db, query="Habits")
    assert search_out["status"] == "success"
    assert search_out["count"] > 0

    # 2. Details tool
    details_out = get_book_details_db(db=db, book_id_or_title="Atomic Habits")
    assert details_out["status"] == "success"
    assert details_out["book"]["title"] == "Atomic Habits"

    # 3. Recommendations tool
    rec_out = recommend_books_db(db=db, limit=3)
    assert rec_out["status"] == "success"
    assert len(rec_out["recommendations"]) <= 3

    # 4. Check credits tool
    arjun = db.query(User).filter(User.email == "arjun@college.edu").first()
    credits_out = check_user_credits_db(db=db, user_id=arjun.id)
    assert credits_out["status"] == "success"
    assert credits_out["credit_balance"] == arjun.credit_balance

    # 5. Delivery estimator tool
    deliv_out = estimate_delivery_db(db=db, seller_pincode="560001", buyer_pincode="570001", book_price=350.0)
    assert deliv_out["status"] == "success"
    assert deliv_out["distance_km"] > 0

    # 6. Budget search tool
    budget_out = find_books_by_budget_db(db=db, max_price=300.0)
    assert budget_out["status"] == "success"
    assert len(budget_out["books"]) > 0

def test_platform_stats(db):
    admin = db.query(User).filter(User.is_admin == True).first()
    stats = get_platform_stats(admin=admin, db=db)
    assert stats["total_users"] >= 4
    assert stats["total_gmv_inr"] >= 0
