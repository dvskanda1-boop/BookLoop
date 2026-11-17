import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import Order, Book, User, UserReadingHistory
from backend.schemas import OrderCreate, OrderResponse, OrderStatusUpdate
from backend.auth import get_current_user
from backend.services.delivery_estimator import estimate_delivery_details

router = APIRouter(prefix="/api/orders", tags=["Orders & E-Commerce"])

def build_order_response(order: Order, db: Session) -> dict:
    book = db.query(Book).filter(Book.id == order.book_id).first()
    seller = db.query(User).filter(User.id == order.seller_id).first()
    buyer = db.query(User).filter(User.id == order.buyer_id).first()

    return {
        "id": order.id,
        "order_number": order.order_number,
        "buyer_id": order.buyer_id,
        "seller_id": order.seller_id,
        "book_id": order.book_id,
        "book_title": book.title if book else "Second-hand Book",
        "book_author": book.author if book else "Unknown",
        "book_image": book.image_url if book else None,
        "book_price": order.book_price,
        "original_mrp": order.original_mrp,
        "delivery_charge": order.delivery_charge,
        "total_amount": order.total_amount,
        "delivery_distance_km": order.delivery_distance_km,
        "recipient_name": order.recipient_name,
        "recipient_phone": order.recipient_phone,
        "buyer_pincode": order.buyer_pincode,
        "buyer_city": order.buyer_city,
        "buyer_state": order.buyer_state,
        "shipping_address": order.shipping_address,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "status": order.status,
        "tracking_number": order.tracking_number,
        "estimated_delivery_date": order.estimated_delivery_date,
        "created_at": order.created_at,
        "seller_name": seller.name if seller else "Seller",
        "seller_city": seller.city if seller else "Bengaluru",
        "buyer_name": buyer.name if buyer else "Buyer"
    }


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Places a second-hand book order, locks single-item stock, and calculates exact delivery on backend."""
    # 1. Fetch book
    book = db.query(Book).filter(Book.id == order_in.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book listing not found.")

    # 2. Safety rules
    if book.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot purchase your own book listing!"
        )

    if not book.is_available or book.is_sold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sorry, '{book.title}' has already been sold or is unavailable."
        )

    # 3. Calculate backend delivery estimate to prevent frontend tampering
    delivery_calc = estimate_delivery_details(
        seller_pincode=book.pickup_pincode or "560001",
        buyer_pincode=order_in.buyer_pincode,
        weight_grams=book.weight_grams or 450,
        book_price=book.selling_price
    )

    delivery_fee = delivery_calc["delivery_charge"]
    total_amount = round(book.selling_price + delivery_fee, 2)
    distance_km = delivery_calc["distance_km"]

    # 4. Generate order number and tracking
    order_num = f"BL-{datetime.datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    tracking_num = f"TRK-{uuid.uuid4().hex[:8].upper()}"
    est_date = delivery_calc["estimated_days"]

    # 5. Lock book stock (Second-hand listings are unique single copies)
    book.is_available = False
    book.is_sold = True

    # 6. Create order record
    new_order = Order(
        order_number=order_num,
        buyer_id=current_user.id,
        seller_id=book.owner_id,
        book_id=book.id,
        book_price=book.selling_price,
        original_mrp=book.original_price,
        delivery_charge=delivery_fee,
        total_amount=total_amount,
        delivery_distance_km=distance_km,
        recipient_name=order_in.recipient_name.strip(),
        recipient_phone=order_in.recipient_phone.strip(),
        buyer_pincode=order_in.buyer_pincode.strip(),
        buyer_city=order_in.buyer_city.strip(),
        buyer_state=order_in.buyer_state or "Karnataka",
        shipping_address=order_in.shipping_address.strip(),
        payment_method=order_in.payment_method,
        payment_status="ON_DELIVERY" if order_in.payment_method == "CASH_ON_DELIVERY" else "PAID",
        status="CONFIRMED",
        tracking_number=tracking_num,
        estimated_delivery_date=est_date
    )
    db.add(new_order)

    # 7. Add to reading/purchase history for AI recommendations
    history_entry = UserReadingHistory(
        user_id=current_user.id,
        book_id=book.id,
        action_type="PURCHASE"
    )
    db.add(history_entry)

    db.commit()
    db.refresh(new_order)

    return build_order_response(new_order, db)


@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all second-hand book purchases made by the current user."""
    orders = db.query(Order).filter(
        Order.buyer_id == current_user.id
    ).order_by(desc(Order.created_at)).all()
    return [build_order_response(o, db) for o in orders]


@router.get("/my-sales", response_model=List[OrderResponse])
def get_my_sales(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all sales where the current user is the seller (for packaging & dispatch)."""
    sales = db.query(Order).filter(
        Order.seller_id == current_user.id
    ).order_by(desc(Order.created_at)).all()
    return [build_order_response(s, db) for s in sales]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_details(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches details for a specific order (Buyer, Seller, or Admin)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.buyer_id != current_user.id and order.seller_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to view this order.")

    return build_order_response(order, db)


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows the seller or admin to progress the order (SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.seller_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the book seller or admin can update order status.")

    new_status = status_update.status.upper()
    order.status = new_status

    # If cancelled, restore book availability
    if new_status == "CANCELLED":
        book = db.query(Book).filter(Book.id == order.book_id).first()
        if book:
            book.is_available = True
            book.is_sold = False

    db.commit()
    db.refresh(order)
    return build_order_response(order, db)
