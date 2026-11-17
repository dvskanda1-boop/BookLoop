from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# ==================== User & Auth Schemas ====================

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6, max_length=100)
    phone: Optional[str] = "+91 98765 43210"
    college: Optional[str] = "National Institute of Technology"
    city: Optional[str] = "Bengaluru"
    pincode: Optional[str] = "560001"
    location: Optional[str] = "Central Campus / Hostel Block"

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    location: Optional[str] = None

class UserPreferenceUpdate(BaseModel):
    favorite_categories: Optional[str] = None
    favorite_authors: Optional[str] = None
    preferred_condition: Optional[str] = None
    bio: Optional[str] = None

class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    favorite_categories: Optional[str] = None
    favorite_authors: Optional[str] = None
    preferred_condition: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    college: Optional[str] = None
    city: Optional[str] = "Bengaluru"
    pincode: Optional[str] = "560001"
    location: Optional[str] = None
    credit_balance: int
    seller_rating: float = 4.8
    total_ratings: int = 0
    is_admin: bool
    is_verified_seller: bool = True
    created_at: datetime
    preferences: Optional[UserPreferenceResponse] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== Book & E-Commerce Schemas ====================

class BookCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "book"
    slug: Optional[str] = None

class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    author: str = Field(..., min_length=1, max_length=150)
    isbn: Optional[str] = None
    description: Optional[str] = None
    category_id: int
    condition: str = Field(default="Good")  # 'Like New', 'Very Good', 'Good', 'Acceptable'
    original_price: float = Field(..., gt=0, description="Original book MRP in INR")
    selling_price: float = Field(..., gt=0, description="Second-hand resale price (must be < original_price)")
    edition: Optional[str] = "Standard Edition"
    publication_year: Optional[int] = 2021
    pages: Optional[int] = 300
    language: str = Field(default="English")
    weight_grams: Optional[int] = 450
    pickup_pincode: Optional[str] = "560001"
    pickup_city: Optional[str] = "Bengaluru"
    pickup_state: Optional[str] = "Karnataka"
    pickup_location_desc: Optional[str] = "Campus / Central Library"
    image_url: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    condition: Optional[str] = None
    original_price: Optional[float] = None
    selling_price: Optional[float] = None
    edition: Optional[str] = None
    publication_year: Optional[int] = None
    pages: Optional[int] = None
    language: Optional[str] = None
    weight_grams: Optional[int] = None
    pickup_pincode: Optional[str] = None
    pickup_city: Optional[str] = None
    pickup_state: Optional[str] = None
    pickup_location_desc: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    is_sold: Optional[bool] = None

class BookResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    author: str
    isbn: Optional[str] = None
    description: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    condition: str
    original_price: float = 500.0
    selling_price: float = 250.0
    discount_percent: float = 50.0
    buyer_savings: float = 250.0
    edition: Optional[str] = None
    publication_year: Optional[int] = None
    pages: Optional[int] = None
    language: str = "English"
    weight_grams: int = 450
    pickup_pincode: str = "560001"
    pickup_city: str = "Bengaluru"
    pickup_state: str = "Karnataka"
    pickup_location_desc: Optional[str] = None
    image_url: Optional[str] = None
    is_available: bool = True
    is_sold: bool = False
    owner_id: int
    owner_name: Optional[str] = None
    owner_college: Optional[str] = None
    owner_location: Optional[str] = None
    owner_city: Optional[str] = None
    owner_rating: Optional[float] = 4.8
    exchange_count: int = 0
    views_count: int = 0
    recommendation_reason: Optional[str] = None
    estimated_distance_km: Optional[float] = None
    created_at: Optional[datetime] = None


# ==================== Pricing AI Recommendation Schemas ====================

class PricingRecommendationRequest(BaseModel):
    title: str
    author: Optional[str] = None
    category: Optional[str] = None
    condition: str = "Good"
    original_price: float = Field(..., gt=0, description="MRP in INR")
    edition: Optional[str] = None
    publication_year: Optional[int] = None

class PricingRecommendationResponse(BaseModel):
    status: str = "success"
    title: str
    original_price: float
    recommended_price: float
    suggested_min_price: float
    suggested_max_price: float
    buyer_savings: float
    discount_percent: float
    condition: str
    rationale: str
    is_ai_generated: bool = False
    disclaimer: str


# ==================== Distance & Delivery Estimator Schemas ====================

class DeliveryEstimateRequest(BaseModel):
    seller_pincode: str = "570001"
    buyer_pincode: str = "560001"
    weight_grams: int = 450
    book_price: float = 350.0

class DeliveryEstimateResponse(BaseModel):
    status: str = "success"
    seller_pincode: str
    buyer_pincode: str
    seller_city: str
    seller_state: str
    buyer_city: str
    buyer_state: str
    distance_km: float
    weight_grams: int
    delivery_charge: float
    standard_delivery_charge: float
    is_free_delivery: bool
    free_delivery_threshold: float
    estimated_days: str
    delivery_zone: str
    total_payable: float
    disclaimer: str


# ==================== Order & Checkout Schemas ====================

class OrderCreate(BaseModel):
    book_id: int
    recipient_name: str = Field(..., min_length=2)
    recipient_phone: str = Field(..., min_length=10)
    buyer_pincode: str = Field(..., min_length=6, max_length=6)
    buyer_city: str
    buyer_state: Optional[str] = "Karnataka"
    shipping_address: str = Field(..., min_length=5)
    payment_method: str = Field(default="CASH_ON_DELIVERY")  # 'CASH_ON_DELIVERY', 'TEST_CHECKOUT'

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_number: str
    buyer_id: int
    seller_id: int
    book_id: int
    book_title: Optional[str] = None
    book_author: Optional[str] = None
    book_image: Optional[str] = None
    book_price: float
    original_mrp: float
    delivery_charge: float
    total_amount: float
    delivery_distance_km: float
    recipient_name: str
    recipient_phone: str
    buyer_pincode: str
    buyer_city: str
    buyer_state: str
    shipping_address: str
    payment_method: str
    payment_status: str
    status: str
    tracking_number: Optional[str] = None
    estimated_delivery_date: Optional[str] = None
    created_at: datetime
    seller_name: Optional[str] = None
    seller_city: Optional[str] = None
    buyer_name: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str  # 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'


# ==================== Delivery Address Schemas ====================

class DeliveryAddressCreate(BaseModel):
    label: str = "Home"  # 'Home', 'Hostel', 'Campus Dept', 'Work'
    recipient_name: str
    phone: str
    street_address: str
    pincode: str
    city: str
    state: str = "Karnataka"
    is_default: bool = False

class DeliveryAddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    label: str
    recipient_name: str
    phone: str
    street_address: str
    pincode: str
    city: str
    state: str
    is_default: bool


# ==================== Wishlist Schemas ====================

class WishlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    book_id: int
    book: Optional[BookResponse] = None
    created_at: datetime


# ==================== Reviews & Ratings Schemas ====================

class ReviewCreate(BaseModel):
    book_id: Optional[int] = None
    seller_id: int
    order_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=2)
    condition_rating: Optional[str] = "Accurate as described"

class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    book_id: Optional[int]
    seller_id: int
    buyer_id: int
    buyer_name: Optional[str] = None
    rating: int
    comment: str
    condition_rating: str
    is_verified_purchase: bool
    created_at: datetime


# ==================== Delivery Rate Rule Schemas (Admin) ====================

class DeliveryRateRuleUpdate(BaseModel):
    base_fee: Optional[float] = None
    base_km_allowance: Optional[float] = None
    per_km_rate: Optional[float] = None
    per_250g_rate: Optional[float] = None
    min_delivery_charge: Optional[float] = None
    free_delivery_threshold: Optional[float] = None


# ==================== Preserved Exchange & Credit Schemas ====================

class ExchangeCreate(BaseModel):
    requested_book_id: int
    offered_book_id: Optional[int] = None
    notes: Optional[str] = None

class ExchangeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    requester_id: int
    requester_name: Optional[str] = None
    owner_id: int
    owner_name: Optional[str] = None
    requested_book: Optional[BookResponse] = None
    offered_book: Optional[BookResponse] = None
    status: str
    notes: Optional[str]
    credits_transferred: int
    created_at: datetime
    updated_at: datetime

class CreditTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    amount: int
    balance_after: int
    transaction_type: str
    description: str
    reference_exchange_id: Optional[int]
    created_at: datetime

class CreditBalanceResponse(BaseModel):
    credit_balance: int
    total_earned: int
    total_spent: int
    transactions: List[CreditTransactionResponse] = []


# ==================== AI Chat Schemas ====================

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    buyer_pincode: Optional[str] = "560001"

class AIChatResponse(BaseModel):
    reply: str
    session_id: str
    tools_used: List[str] = []
    book_cards: List[BookResponse] = []
    user_credits: Optional[int] = None


# ==================== Admin Stats Schemas ====================

class PlatformStats(BaseModel):
    total_users: int
    total_books: int
    available_books: int
    sold_books: int
    total_orders: int
    completed_orders: int
    total_gmv_inr: float
    total_exchanges: int
    completed_exchanges: int
    total_credits_circulating: int
