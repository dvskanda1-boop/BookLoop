from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas import DeliveryEstimateRequest, DeliveryEstimateResponse
from backend.services.delivery_estimator import estimate_delivery_details, lookup_pincode_coordinates

router = APIRouter(prefix="/api/delivery", tags=["Delivery & Distance"])

@router.post("/estimate", response_model=DeliveryEstimateResponse)
def estimate_delivery(req: DeliveryEstimateRequest):
    """Calculates road courier distance, estimated delivery charge, and transit days between PIN codes."""
    res = estimate_delivery_details(
        seller_pincode=req.seller_pincode,
        buyer_pincode=req.buyer_pincode,
        weight_grams=req.weight_grams or 450,
        book_price=req.book_price or 0.0
    )
    return res

@router.get("/pincode-lookup/{pincode}")
def lookup_pincode(pincode: str):
    """Quick lookup of city, state, and approximate coordinates for any 6-digit Indian PIN code."""
    lat, lon, city, state = lookup_pincode_coordinates(pincode)
    return {
        "pincode": pincode,
        "city": city,
        "state": state,
        "latitude": lat,
        "longitude": lon
    }
