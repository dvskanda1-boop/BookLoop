import json
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from google import genai
from google.genai import types

from backend.config import settings
from backend.models import ChatSession, ChatMessage, Book
from backend.services.tools import (
    search_books_db,
    find_books_by_budget_db,
    get_resale_price_advice_db,
    estimate_delivery_db,
    get_book_details_db,
    recommend_books_db,
    check_user_credits_db,
    get_my_books_db,
    create_exchange_request_db,
    get_exchange_status_db,
    search_by_category_db
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are BookLoop AI, an intelligent, helpful, and friendly second-hand book shopping and exchange assistant.

PLATFORM MISSION & MOTTO:
"Don't let a good book sit on a shelf. Give it a second life, and let someone else enjoy the story at a lower price."
"Read. Resell. Repeat. Every book deserves another chapter."

YOUR CORE CAPABILITIES:
1. Search second-hand books by title, author, category, condition, or budget (e.g. "books under ₹200").
2. Explain second-hand pricing, original MRP, and buyer savings (e.g. ₹800 MRP sold for ₹350 = 56% discount!).
3. Help sellers price their used books fairly using get_resale_price_advice().
4. Estimate road courier delivery charges and transit time between PIN codes.
5. Check credit balances for peer-to-peer barter exchanges.
6. Recommend books based on user interests and academic subjects.

CRITICAL OPERATIONAL RULES:
- ALWAYS use your tools (search_books, find_books_by_budget, estimate_delivery, etc.) to query real database inventory and prices.
- NEVER invent or hallucinate book titles, prices, stock availability, or delivery charges.
- Highlight the second-hand savings for students (e.g. "Save ₹450 compared to MRP!").
- Keep your tone welcoming, student-friendly, and concise. Format responses with clean bullet points.
"""

def execute_agent_chat(
    db: Session,
    user_message: str,
    session_id: str,
    user_id: Optional[int] = None,
    user_name: Optional[str] = None,
    buyer_pincode: Optional[str] = "560001"
) -> Dict[str, Any]:
    """Orchestrates the AI Agent conversation with Gemini and bound database e-commerce tools."""
    
    tools_used: List[str] = []
    book_cards: List[Dict[str, Any]] = []

    # Contextual tool functions
    def search_books(
        query: str = "",
        category: Optional[str] = None,
        condition: Optional[str] = None,
        max_price: Optional[float] = None
    ) -> str:
        """Search the second-hand database for pre-owned books by title, author, condition, or budget.
        
        Args:
            query: Title, author, or keyword.
            category: Optional category name.
            condition: Condition ('Like New', 'Very Good', 'Good', 'Acceptable').
            max_price: Optional max budget in INR.
        """
        tools_used.append("search_books")
        res = search_books_db(db=db, query=query, category=category, condition=condition, max_price=max_price)
        if res.get("books"):
            book_cards.extend(res["books"])
        return json.dumps(res)

    def find_books_by_budget(max_price: float = 200.0) -> str:
        """Find second-hand books under a maximum price ceiling in INR (e.g. 100, 200, 300).
        
        Args:
            max_price: Maximum budget in INR.
        """
        tools_used.append("find_books_by_budget")
        res = find_books_by_budget_db(db=db, max_price=max_price)
        if res.get("books"):
            book_cards.extend(res["books"])
        return json.dumps(res)

    def get_resale_price_advice(title: str, original_price: float, condition: str = "Good") -> str:
        """Suggest a fair second-hand resale price range for a book a student wants to sell.
        
        Args:
            title: Book title.
            original_price: Original MRP in INR.
            condition: Book condition ('Like New', 'Very Good', 'Good', 'Acceptable').
        """
        tools_used.append("get_resale_price_advice")
        res = get_resale_price_advice_db(title=title, original_price=original_price, condition=condition)
        return json.dumps(res)

    def estimate_delivery(seller_pincode: str = "570001", dest_pincode: Optional[str] = None) -> str:
        """Calculate road courier distance and delivery charge between origin and destination PIN codes.
        
        Args:
            seller_pincode: 6-digit origin PIN code.
            dest_pincode: 6-digit destination PIN code (defaults to buyer's current PIN).
        """
        tools_used.append("estimate_delivery")
        target_pin = dest_pincode or buyer_pincode or "560001"
        res = estimate_delivery_db(seller_pincode=seller_pincode, buyer_pincode=target_pin)
        return json.dumps(res)

    def get_book_details(book_id_or_title: str) -> str:
        """Get full details of a specific book by ID or title from the database."""
        tools_used.append("get_book_details")
        res = get_book_details_db(db=db, book_id_or_title=book_id_or_title)
        if res.get("status") == "success" and res.get("book"):
            book_cards.append(res["book"])
        return json.dumps(res)

    def recommend_books(category: Optional[str] = None, limit: int = 4) -> str:
        """Recommend second-hand books matching student preferences or subject."""
        tools_used.append("recommend_books")
        res = recommend_books_db(db=db, user_id=user_id, category=category, limit=limit)
        if res.get("recommendations"):
            book_cards.extend(res["recommendations"])
        return json.dumps(res)

    def check_user_credits() -> str:
        """Check user's exchange credits balance."""
        tools_used.append("check_user_credits")
        res = check_user_credits_db(db=db, user_id=user_id)
        return json.dumps(res)

    def get_my_books() -> str:
        """Retrieve books listed for sale by the authenticated user."""
        tools_used.append("get_my_books")
        res = get_my_books_db(db=db, user_id=user_id)
        return json.dumps(res)

    def search_by_category(category_name: str) -> str:
        """Search available books in a specific category."""
        tools_used.append("search_by_category")
        res = search_by_category_db(db=db, category_name=category_name)
        if res.get("books"):
            book_cards.extend(res["books"])
        return json.dumps(res)

    agent_tools = [
        search_books,
        find_books_by_budget,
        get_resale_price_advice,
        estimate_delivery,
        get_book_details,
        recommend_books,
        check_user_credits,
        get_my_books,
        search_by_category
    ]

    # Check API key
    if not settings.GEMINI_API_KEY:
        return fallback_agent_response(db, user_message, user_id, tools_used, book_cards, session_id, buyer_pincode)

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        auth_context = f"\nUSER CONTEXT: Student: '{user_name or 'Guest'}' (ID: {user_id or 'None'}). Current Delivery PIN: {buyer_pincode or '560001'}."
        full_system = SYSTEM_PROMPT + auth_context

        candidate_models = [settings.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-3.8-flash"]
        candidate_models = list(dict.fromkeys(candidate_models))

        final_reply = None
        last_error = None

        for model_name in candidate_models:
            try:
                chat = client.chats.create(
                    model=model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=full_system,
                        tools=agent_tools,
                        temperature=0.7
                    )
                )
                resp = chat.send_message(user_message)
                final_reply = resp.text
                if final_reply:
                    break
            except Exception as model_err:
                last_error = model_err
                logger.warning(f"Model {model_name} failed: {model_err}. Trying next candidate...")
                continue

        if not final_reply:
            raise last_error or Exception("All Gemini models were unavailable.")

    except Exception as e:
        logger.error(f"Gemini API error during chat execution: {e}")
        return fallback_agent_response(
            db, user_message, user_id, tools_used, book_cards, session_id, buyer_pincode,
            error_msg=f"Note: Gemini live intelligence encountered a temporary notice ({type(e).__name__}). Using local database search engine."
        )

    # Deduplicate book cards
    unique_books = []
    seen_ids = set()
    for b in book_cards:
        b_id = b.get("id")
        if b_id and b_id not in seen_ids:
            seen_ids.add(b_id)
            unique_books.append(b)

    return {
        "reply": final_reply,
        "session_id": session_id,
        "tools_used": list(set(tools_used)),
        "book_cards": unique_books
    }


def fallback_agent_response(
    db: Session,
    user_message: str,
    user_id: Optional[int],
    tools_used: List[str],
    book_cards: List[Dict[str, Any]],
    session_id: str,
    buyer_pincode: Optional[str] = "560001",
    error_msg: Optional[str] = None
) -> Dict[str, Any]:
    """Deterministic fallback engine when Gemini API is offline or hitting rate limits."""
    msg_lower = user_message.lower()

    # Budget queries (e.g. "under 200", "under 100", "cheap")
    import re
    budget_match = re.search(r"under\s*(?:rs\.?|inr|₹)?\s*(\d+)", msg_lower)
    if budget_match:
        budget = float(budget_match.group(1))
        tools_used.append("find_books_by_budget")
        b_res = find_books_by_budget_db(db, max_price=budget)
        found = b_res.get("books", [])
        book_cards.extend(found)
        reply = f"📚 Here are pre-owned books available on BookLoop **under ₹{budget:.0f}**:\n\n"
        for b in found:
            reply += f"• **{b['title']}** by {b['author']} — **₹{b['selling_price']:.0f}** (~~₹{b['original_price']:.0f}~~, {b['discount_percent']}% off!)\n"
        reply += "\nAll second-hand listings are verified by student sellers on campus!"
        return {
            "reply": f"{error_msg}\n\n{reply}" if error_msg else reply,
            "session_id": session_id,
            "tools_used": list(set(tools_used)),
            "book_cards": book_cards
        }

    # Credit queries
    if "credit" in msg_lower or "balance" in msg_lower or "wallet" in msg_lower:
        tools_used.append("check_user_credits")
        credits_res = check_user_credits_db(db, user_id)
        reply = credits_res.get("message", "Please log in to check your wallet balance.")
        return {
            "reply": f"{error_msg}\n\n{reply}" if error_msg else reply,
            "session_id": session_id,
            "tools_used": list(set(tools_used)),
            "book_cards": []
        }

    # Search queries
    tools_used.append("search_books")
    search_res = search_books_db(db, query=user_message.strip(), available_only=True)
    if not search_res.get("books"):
        clean_q = " ".join([w for w in user_message.split() if w.lower() not in ["find", "me", "some", "books", "a", "the", "i", "want", "second-hand"]])
        search_res = search_books_db(db, query=clean_q.strip(), available_only=True)

    found_books = search_res.get("books", [])
    if found_books:
        book_cards.extend(found_books)
        reply = f"📚 Found {len(found_books)} second-hand books matching **'{user_message}'**:\n\n"
        for b in found_books[:4]:
            reply += f"• **{b['title']}** by {b['author']} ({b['condition']}) — **₹{b['selling_price']:.0f}** (Save ₹{b['buyer_savings']:.0f})\n"
        reply += "\nClick any book card below to check delivery charges or buy now!"
    else:
        # Recommendations fallback
        tools_used.append("recommend_books")
        rec_res = recommend_books_db(db, user_id=user_id, limit=4)
        recs = rec_res.get("recommendations", [])
        book_cards.extend(recs)
        reply = "I couldn't find an exact match, but here are some popular pre-loved books currently on sale:\n\n"
        for b in recs[:4]:
            reply += f"• **{b['title']}** — **₹{b['selling_price']:.0f}** ({b['discount_percent']}% off)\n"

    return {
        "reply": f"{error_msg}\n\n{reply}" if error_msg else reply,
        "session_id": session_id,
        "tools_used": list(set(tools_used)),
        "book_cards": book_cards
    }
