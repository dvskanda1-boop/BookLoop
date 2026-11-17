"""
Import BookLoop data from JSON export into any active database connection (PostgreSQL or SQLite).
"""
import json
from datetime import datetime
from backend.database import SessionLocal, Base, engine
from backend.models import (
    User, BookCategory, Book, BookImage, Order, DeliveryAddress,
    DeliveryRateRule, Wishlist, Review, UserReadingHistory,
    ExchangeRequest, CreditTransaction, UserPreference
)

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except Exception:
        return None

def import_all():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        with open("bookloop_database_export.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Delivery Rules
        for r in data.get("delivery_rules", []):
            if not db.query(DeliveryRateRule).filter_by(id=r["id"]).first():
                db.add(DeliveryRateRule(**r))
        db.commit()

        # 2. Categories
        for c in data.get("categories", []):
            if not db.query(BookCategory).filter_by(id=c["id"]).first():
                db.add(BookCategory(**c))
        db.commit()

        # 3. Users
        for u in data.get("users", []):
            u_data = dict(u)
            if "created_at" in u_data and isinstance(u_data["created_at"], str):
                u_data["created_at"] = parse_date(u_data["created_at"])
            if not db.query(User).filter_by(id=u_data["id"]).first():
                db.add(User(**u_data))
        db.commit()

        # 4. Books
        for b in data.get("books", []):
            b_data = dict(b)
            if "created_at" in b_data and isinstance(b_data["created_at"], str):
                b_data["created_at"] = parse_date(b_data["created_at"])
            if not db.query(Book).filter_by(id=b_data["id"]).first():
                db.add(Book(**b_data))
        db.commit()

        # 5. Addresses
        for a in data.get("delivery_addresses", []):
            a_data = dict(a)
            if "created_at" in a_data and isinstance(a_data["created_at"], str):
                a_data["created_at"] = parse_date(a_data["created_at"])
            if not db.query(DeliveryAddress).filter_by(id=a_data["id"]).first():
                db.add(DeliveryAddress(**a_data))
        db.commit()

        # 6. Orders
        for o in data.get("orders", []):
            o_data = dict(o)
            for dfield in ["created_at", "updated_at", "shipped_at", "delivered_at"]:
                if dfield in o_data and isinstance(o_data[dfield], str):
                    o_data[dfield] = parse_date(o_data[dfield])
            if not db.query(Order).filter_by(id=o_data["id"]).first():
                db.add(Order(**o_data))
        db.commit()

        # 7. Reviews
        for rv in data.get("reviews", []):
            rv_data = dict(rv)
            if "created_at" in rv_data and isinstance(rv_data["created_at"], str):
                rv_data["created_at"] = parse_date(rv_data["created_at"])
            if not db.query(Review).filter_by(id=rv_data["id"]).first():
                db.add(Review(**rv_data))
        db.commit()

        # 8. User Preferences
        for p in data.get("user_preferences", []):
            p_data = dict(p)
            if "updated_at" in p_data and isinstance(p_data["updated_at"], str):
                p_data["updated_at"] = parse_date(p_data["updated_at"])
            if not db.query(UserPreference).filter_by(id=p_data["id"]).first():
                db.add(UserPreference(**p_data))
        db.commit()

        print("SUCCESS: Data successfully imported into the active database!")

    finally:
        db.close()

if __name__ == "__main__":
    import_all()
