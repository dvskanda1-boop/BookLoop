from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, Text, Float, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True, default="+91 98765 43210")
    college = Column(String(150), default="National Institute of Technology")
    city = Column(String(80), default="Bengaluru")
    pincode = Column(String(10), default="560001")
    location = Column(String(150), default="Central Campus / Hostel Block")
    credit_balance = Column(Integer, default=10, nullable=False)
    seller_rating = Column(Float, default=4.8)
    total_ratings = Column(Integer, default=5)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_verified_seller = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    # Relationships
    books = relationship("Book", back_populates="owner", cascade="all, delete-orphan")
    sent_requests = relationship(
        "ExchangeRequest",
        foreign_keys="ExchangeRequest.requester_id",
        back_populates="requester"
    )
    received_requests = relationship(
        "ExchangeRequest",
        foreign_keys="ExchangeRequest.owner_id",
        back_populates="owner"
    )
    credit_transactions = relationship(
        "CreditTransaction",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(CreditTransaction.created_at)"
    )
    preferences = relationship(
        "UserPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    chat_sessions = relationship(
        "ChatSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    orders_bought = relationship(
        "Order",
        foreign_keys="Order.buyer_id",
        back_populates="buyer",
        cascade="all, delete-orphan",
        order_by="desc(Order.created_at)"
    )
    orders_sold = relationship(
        "Order",
        foreign_keys="Order.seller_id",
        back_populates="seller",
        order_by="desc(Order.created_at)"
    )
    addresses = relationship(
        "DeliveryAddress",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    wishlist_items = relationship(
        "Wishlist",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(Wishlist.created_at)"
    )
    reviews_given = relationship(
        "Review",
        foreign_keys="Review.buyer_id",
        back_populates="buyer"
    )
    reviews_received = relationship(
        "Review",
        foreign_keys="Review.seller_id",
        back_populates="seller"
    )
    reading_history = relationship(
        "UserReadingHistory",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(UserReadingHistory.created_at)"
    )


class BookCategory(Base):
    __tablename__ = "book_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    icon = Column(String(50), default="book")
    slug = Column(String(80), nullable=True)

    books = relationship("Book", back_populates="category_rel")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), index=True, nullable=False)
    author = Column(String(150), index=True, nullable=False)
    isbn = Column(String(30), nullable=True)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("book_categories.id"), nullable=False)
    condition = Column(String(50), default="Good")  # 'Like New', 'Very Good', 'Good', 'Acceptable'
    
    # E-Commerce Pricing & Discount
    original_price = Column(Float, nullable=False, default=500.0)    # MRP in INR
    selling_price = Column(Float, nullable=False, default=250.0)     # Second-hand seller price (must be < original_price)
    discount_percent = Column(Float, nullable=False, default=50.0)   # Pre-calculated discount percentage
    
    # Second-hand specific metadata
    edition = Column(String(80), nullable=True, default="Standard Edition")
    publication_year = Column(Integer, nullable=True, default=2021)
    pages = Column(Integer, nullable=True, default=350)
    language = Column(String(50), default="English")
    weight_grams = Column(Integer, default=450)  # Package weight for delivery calculations
    image_url = Column(String(500), nullable=True)

    # Location & Pickup data for distance calculations
    pickup_pincode = Column(String(10), default="560001", index=True)
    pickup_city = Column(String(80), default="Bengaluru", index=True)
    pickup_state = Column(String(80), default="Karnataka")
    pickup_location_desc = Column(String(150), default="Campus / Central Area")

    # Availability & Stock status
    is_available = Column(Boolean, default=True, index=True)
    is_sold = Column(Boolean, default=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exchange_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    owner = relationship("User", back_populates="books")
    category_rel = relationship("BookCategory", back_populates="books")
    exchange_requests = relationship(
        "ExchangeRequest",
        foreign_keys="ExchangeRequest.requested_book_id",
        back_populates="requested_book"
    )
    images = relationship("BookImage", back_populates="book", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="book")
    reviews = relationship("Review", back_populates="book")
    wishlist_entries = relationship("Wishlist", back_populates="book", cascade="all, delete-orphan")


class BookImage(Base):
    __tablename__ = "book_images"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    book = relationship("Book", back_populates="images")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)

    book_price = Column(Float, nullable=False)
    original_mrp = Column(Float, nullable=False)
    delivery_charge = Column(Float, nullable=False, default=40.0)
    total_amount = Column(Float, nullable=False)
    delivery_distance_km = Column(Float, default=10.0)

    # Shipping details
    recipient_name = Column(String(100), nullable=False)
    recipient_phone = Column(String(20), nullable=False)
    buyer_pincode = Column(String(10), nullable=False)
    buyer_city = Column(String(80), nullable=False)
    buyer_state = Column(String(80), default="Karnataka")
    shipping_address = Column(Text, nullable=False)

    payment_method = Column(String(50), default="CASH_ON_DELIVERY")  # 'CASH_ON_DELIVERY', 'TEST_CHECKOUT'
    payment_status = Column(String(30), default="ON_DELIVERY")       # 'PAID', 'ON_DELIVERY', 'REFUNDED'
    status = Column(String(30), default="PLACED", index=True)        # 'PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    tracking_number = Column(String(50), nullable=True)
    estimated_delivery_date = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="orders_bought")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="orders_sold")
    book = relationship("Book", back_populates="orders")
    reviews = relationship("Review", back_populates="order")


class DeliveryAddress(Base):
    __tablename__ = "delivery_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String(50), default="Home")  # 'Home', 'Hostel', 'Campus Dept', 'Work'
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    street_address = Column(Text, nullable=False)
    pincode = Column(String(10), nullable=False)
    city = Column(String(80), nullable=False)
    state = Column(String(80), default="Karnataka")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="addresses")


class DeliveryRateRule(Base):
    __tablename__ = "delivery_rate_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Standard Courier Slab")
    base_fee = Column(Float, default=35.0)              # Flat fee up to base_km_allowance
    base_km_allowance = Column(Float, default=15.0)     # First 15 km covered by base fee
    per_km_rate = Column(Float, default=1.80)           # Per km above 15 km
    per_250g_rate = Column(Float, default=5.0)          # Per 250g above 500g
    min_delivery_charge = Column(Float, default=30.0)
    free_delivery_threshold = Column(Float, default=800.0)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Wishlist(Base):
    __tablename__ = "wishlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="wishlist_items")
    book = relationship("Book", back_populates="wishlist_entries")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5 stars
    comment = Column(Text, nullable=False)
    condition_rating = Column(String(50), default="Accurate as described")
    is_verified_purchase = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="reviews_given")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="reviews_received")
    book = relationship("Book", back_populates="reviews")
    order = relationship("Order", back_populates="reviews")


class UserReadingHistory(Base):
    __tablename__ = "user_reading_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True)
    action_type = Column(String(50), default="VIEW")  # 'VIEW', 'PURCHASE', 'SEARCH', 'EXCHANGE', 'WISHLIST'
    query_term = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="reading_history")


class ReportedListing(Base):
    __tablename__ = "reported_listings"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(30), default="PENDING")  # 'PENDING', 'RESOLVED', 'DISMISSED'
    created_at = Column(DateTime(timezone=True), default=utcnow)


# Preserved Peer-to-Peer Exchange & Legacy Tables
class ExchangeRequest(Base):
    __tablename__ = "exchange_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requested_book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    offered_book_id = Column(Integer, ForeignKey("books.id"), nullable=True)
    status = Column(String(30), default="PENDING", index=True)  # PENDING, ACCEPTED, REJECTED, CANCELLED, COMPLETED
    notes = Column(Text, nullable=True)
    credits_transferred = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_requests")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="received_requests")
    requested_book = relationship("Book", foreign_keys=[requested_book_id], back_populates="exchange_requests")
    offered_book = relationship("Book", foreign_keys=[offered_book_id])


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # +10, -2, +2
    balance_after = Column(Integer, nullable=False)
    transaction_type = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    reference_exchange_id = Column(Integer, ForeignKey("exchange_requests.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="credit_transactions")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    favorite_categories = Column(String(255), default="Computer Science, Literature")
    favorite_authors = Column(String(255), default="Robert C. Martin, George Orwell")
    preferred_condition = Column(String(50), default="Any")
    bio = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="preferences")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200), default="BookLoop Assistant Chat")
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), ForeignKey("chat_sessions.session_id"), nullable=False, index=True)
    role = Column(String(30), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    tool_calls_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    session = relationship("ChatSession", back_populates="messages")
