import json
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from google import genai
from google.genai import types

from backend.config import settings
from backend.models import Book

logger = logging.getLogger(__name__)

# Condition discount benchmarks for second-hand books
CONDITION_DISCOUNT_BENCHMARKS = {
    "Like New": {"min_pct": 35, "recommended_pct": 42, "max_pct": 52},
    "Very Good": {"min_pct": 45, "recommended_pct": 52, "max_pct": 62},
    "Good": {"min_pct": 55, "recommended_pct": 62, "max_pct": 72},
    "Acceptable": {"min_pct": 65, "recommended_pct": 74, "max_pct": 82}
}

def calculate_heuristic_price(
    original_price: float,
    condition: str,
    publication_year: Optional[int] = None
) -> Dict[str, Any]:
    """Calculates deterministic benchmark resale price range based on MRP and condition."""
    cond_clean = condition.title().strip() if condition else "Good"
    bench = CONDITION_DISCOUNT_BENCHMARKS.get(cond_clean, CONDITION_DISCOUNT_BENCHMARKS["Good"])

    # Age adjustment: older publications get an additional slight discount
    current_year = 2026
    age_adjust = 0
    if publication_year and publication_year < current_year:
        years_old = current_year - publication_year
        if years_old > 3:
            age_adjust = min((years_old - 3) * 1.5, 8.0)

    rec_discount_pct = min(bench["recommended_pct"] + age_adjust, 85.0)
    min_discount_pct = max(bench["min_pct"] + (age_adjust * 0.5), 25.0)
    max_discount_pct = min(bench["max_pct"] + age_adjust, 88.0)

    # Calculate prices
    # Note: Higher discount % means lower selling price!
    recommended_price = round(original_price * (1.0 - (rec_discount_pct / 100.0)))
    max_seller_price = round(original_price * (1.0 - (min_discount_pct / 100.0)))  # High end for seller
    min_seller_price = round(original_price * (1.0 - (max_discount_pct / 100.0)))  # Budget end for quick sale

    # Safety clamps: Must be strictly lower than original price
    recommended_price = min(max(recommended_price, 30.0), original_price - 20.0)
    max_seller_price = min(max(max_seller_price, recommended_price), original_price - 10.0)
    min_seller_price = min(max(min_seller_price, 25.0), recommended_price)

    buyer_savings = round(original_price - recommended_price, 2)
    discount_pct = round(((original_price - recommended_price) / original_price) * 100.0, 1)

    return {
        "original_price": original_price,
        "recommended_price": float(recommended_price),
        "suggested_min_price": float(min_seller_price),
        "suggested_max_price": float(max_seller_price),
        "buyer_savings": buyer_savings,
        "discount_percent": discount_pct,
        "condition": cond_clean
    }


def get_ai_price_recommendation(
    title: str,
    original_price: float,
    condition: str,
    author: Optional[str] = None,
    category: Optional[str] = None,
    edition: Optional[str] = None,
    publication_year: Optional[int] = None,
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """Generates intelligent resale price recommendation using Gemini AI with fallback."""
    # 1. Base mathematical heuristic
    base_calc = calculate_heuristic_price(original_price, condition, publication_year)

    # 2. Check comparable listings in database if db session provided
    comparable_note = ""
    if db:
        try:
            comps = db.query(Book).filter(
                or_(
                    Book.title.ilike(f"%{title[:20]}%"),
                    Book.author.ilike(f"%{author[:15]}%") if author else False
                )
            ).limit(3).all()
            if comps:
                comp_prices = [c.selling_price for c in comps if c.selling_price]
                if comp_prices:
                    avg_comp = sum(comp_prices) / len(comp_prices)
                    comparable_note = f"Similar pre-owned books on BookLoop are currently listed around ₹{int(avg_comp)}."
        except Exception as e:
            logger.warning(f"Error querying comparable listings: {e}")

    # Default fallback rationale
    fallback_rationale = (
        f"Based on the original MRP of ₹{original_price:.0f} and '{condition}' condition, "
        f"we suggest listing at ₹{base_calc['recommended_price']:.0f} (a {base_calc['discount_percent']}% discount). "
        f"This offers the buyer ₹{base_calc['buyer_savings']:.0f} in savings while ensuring competitive demand."
    )
    if comparable_note:
        fallback_rationale += f" {comparable_note}"

    # 3. Call Gemini if API Key is configured
    ai_rationale = None
    if settings.GEMINI_API_KEY:
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""
You are the BookLoop AI pricing specialist for a second-hand college book marketplace.
Book: "{title}" by {author or 'Unknown'}
Category: {category or 'General'}
Condition: {condition}
Edition: {edition or 'Standard'}
Publication Year: {publication_year or 'Recent'}
Original MRP: ₹{original_price:.0f}
Benchmark Resale Price: ₹{base_calc['recommended_price']:.0f} (Range: ₹{base_calc['suggested_min_price']:.0f} - ₹{base_calc['suggested_max_price']:.0f})

Write a concise, 2-to-3 sentence explanation to the seller explaining why ₹{base_calc['recommended_price']:.0f} is a fair second-hand selling price, citing the book condition and savings for the buyer. Keep it professional and encouraging. Do not invent real-time market indices.
"""
            resp = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            if resp.text:
                ai_rationale = resp.text.strip()
        except Exception as err:
            logger.warning(f"Gemini pricing call failed ({err}). Using heuristic rationale.")

    return {
        "status": "success",
        "title": title,
        "original_price": original_price,
        "recommended_price": base_calc["recommended_price"],
        "recommended_selling_price": base_calc["recommended_price"],
        "suggested_min_price": base_calc["suggested_min_price"],
        "suggested_max_price": base_calc["suggested_max_price"],
        "buyer_savings": base_calc["buyer_savings"],
        "discount_percent": base_calc["discount_percent"],
        "condition": base_calc["condition"],
        "condition_depreciation_analysis": f"Condition '{condition}' benchmark establishes {base_calc['discount_percent']:.0f}% depreciation below original MRP.",
        "rationale": ai_rationale or fallback_rationale,
        "pricing_rationale": ai_rationale or fallback_rationale,
        "is_ai_generated": bool(ai_rationale),
        "disclaimer": "AI recommendation based on condition depreciation, publication details, and platform listings. Sellers have full freedom to choose their own price below MRP."
    }
