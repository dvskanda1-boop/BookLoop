from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import get_db
from backend.models import DeliveryAddress, User
from backend.schemas import DeliveryAddressCreate, DeliveryAddressResponse
from backend.auth import get_current_user

router = APIRouter(prefix="/api/addresses", tags=["Delivery Addresses"])

@router.get("", response_model=List[DeliveryAddressResponse])
def get_my_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all saved delivery addresses for the authenticated user."""
    return db.query(DeliveryAddress).filter(
        DeliveryAddress.user_id == current_user.id
    ).order_by(desc(DeliveryAddress.is_default), desc(DeliveryAddress.created_at)).all()


@router.post("", response_model=DeliveryAddressResponse, status_code=status.HTTP_201_CREATED)
def create_delivery_address(
    addr_in: DeliveryAddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Saves a new campus or home delivery address."""
    # If set as default, reset other defaults
    if addr_in.is_default:
        db.query(DeliveryAddress).filter(
            DeliveryAddress.user_id == current_user.id
        ).update({"is_default": False})

    new_addr = DeliveryAddress(
        user_id=current_user.id,
        label=addr_in.label,
        recipient_name=addr_in.recipient_name.strip(),
        phone=addr_in.phone.strip(),
        street_address=addr_in.street_address.strip(),
        pincode=addr_in.pincode.strip(),
        city=addr_in.city.strip(),
        state=addr_in.state or "Karnataka",
        is_default=addr_in.is_default
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_delivery_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Removes a saved address."""
    addr = db.query(DeliveryAddress).filter(
        DeliveryAddress.id == address_id,
        DeliveryAddress.user_id == current_user.id
    ).first()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    db.delete(addr)
    db.commit()
    return None
