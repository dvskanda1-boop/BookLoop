"""
Export all BookLoop SQLite data to a portable JSON backup.
Used for zero data-loss migration from SQLite to cloud PostgreSQL.
"""
import json
from datetime import datetime
from backend.database import SessionLocal
from backend.models import (
    User, BookCategory, Book, BookImage, Order, DeliveryAddress,
    DeliveryRateRule, Wishlist, Review, UserReadingHistory,
    ExchangeRequest, CreditTransaction, UserPreference
)

def default_serializer(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def export_all():
    db = SessionLocal()
    backup_data = {}

    try:
        models = [
            ("delivery_rules", DeliveryRateRule),
            ("categories", BookCategory),
            ("users", User),
            ("books", Book),
            ("book_images", BookImage),
            ("delivery_addresses", DeliveryAddress),
            ("orders", Order),
            ("wishlist", Wishlist),
            ("reviews", Review),
            ("reading_history", UserReadingHistory),
            ("exchange_requests", ExchangeRequest),
            ("credit_transactions", CreditTransaction),
            ("user_preferences", UserPreference),
        ]

        for key, model_cls in models:
            records = db.query(model_cls).all()
            serialized_list = []
            for r in records:
                row_dict = {}
                for col in r.__table__.columns:
                    val = getattr(r, col.name)
                    row_dict[col.name] = val
                serialized_list.append(row_dict)
            backup_data[key] = serialized_list
            print(f"Exported {len(serialized_list)} rows from {key}")

        with open("bookloop_database_export.json", "w", encoding="utf-8") as f:
            json.dump(backup_data, f, indent=2, default=default_serializer)

        print("\nSUCCESS: All data exported cleanly to 'bookloop_database_export.json'!")

    finally:
        db.close()

if __name__ == "__main__":
    export_all()
