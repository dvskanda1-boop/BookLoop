import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, ChatSession, ChatMessage, Book
from backend.schemas import (
    AIChatRequest, AIChatResponse, BookResponse,
    PricingRecommendationRequest, PricingRecommendationResponse
)
from backend.auth import get_optional_current_user, get_current_user
from backend.services.ai_agent import execute_agent_chat
from backend.services.pricing_ai import get_ai_price_recommendation
from backend.services.recommendations import (
    get_personalized_recommendations,
    get_best_deals,
    get_books_by_budget,
    get_books_near_location
)

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence & Pricing"])

@router.post("/chat", response_model=AIChatResponse)
def chat_with_agent(
    req: AIChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Conversational shopping assistant powered by Gemini AI with tool calling."""
    session_id = req.session_id or str(uuid.uuid4())

    # Get or create chat session
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        session = ChatSession(
            session_id=session_id,
            user_id=current_user.id if current_user else None,
            title=req.message[:50]
        )
        db.add(session)
        db.commit()

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    db.commit()

    # Execute AI Agent
    result = execute_agent_chat(
        db=db,
        user_message=req.message,
        session_id=session_id,
        user_id=current_user.id if current_user else None,
        user_name=current_user.name if current_user else "Student Buyer",
        buyer_pincode=req.buyer_pincode or (current_user.pincode if current_user else "560001")
    )

    # Save assistant message
    ai_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=result["reply"],
        tool_calls_json=",".join(result.get("tools_used", []))
    )
    db.add(ai_msg)
    db.commit()

    return {
        "reply": result["reply"],
        "session_id": session_id,
        "tools_used": result.get("tools_used", []),
        "book_cards": result.get("book_cards", []),
        "user_credits": current_user.credit_balance if current_user else None
    }


@router.post("/recommend-price", response_model=PricingRecommendationResponse)
def recommend_resale_price(
    req: PricingRecommendationRequest,
    db: Session = Depends(get_db)
):
    """AI Smart Resale Price Recommendation endpoint for sellers."""
    res = get_ai_price_recommendation(
        title=req.title,
        original_price=req.original_price,
        condition=req.condition,
        author=req.author,
        category=req.category,
        edition=req.edition,
        publication_year=req.publication_year,
        db=db
    )
    return res


@router.get("/shelves")
def get_curated_home_shelves(
    pincode: Optional[str] = "560001",
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Provides complete set of curated recommendation shelves for the home page."""
    user_id = current_user.id if current_user else None
    effective_pincode = pincode or (current_user.pincode if current_user else "560001")

    return {
        "recommended_for_you": get_personalized_recommendations(db=db, user_id=user_id, limit=6),
        "best_deals": get_best_deals(db=db, min_discount=45.0, limit=6),
        "under_100": get_books_by_budget(db=db, max_price=150.0, limit=6),
        "under_250": get_books_by_budget(db=db, max_price=250.0, limit=6),
        "books_near_you": get_books_near_location(db=db, buyer_pincode=effective_pincode, max_distance_km=150.0, limit=6)
    }


@router.get("/recommendations", response_model=List[BookResponse])
def get_personalized_recommendations_endpoint(
    limit: int = 6,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Personalized recommendations endpoint based on user history."""
    user_id = current_user.id if current_user else None
    return get_personalized_recommendations(db=db, user_id=user_id, limit=limit)
