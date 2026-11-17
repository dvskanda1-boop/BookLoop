import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load the root .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "BookLoop AI"
    VERSION: str = "2.0.0"
    TAGLINE: str = "Read. Resell. Repeat. Every book deserves another chapter."
    DESCRIPTION: str = "Complete AI-Powered Second-Hand Book Marketplace & Exchange Platform"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'bookloop.db'}")

    # Gemini AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "bookloop-super-secure-production-secret-key-32bytes")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Exchange Credit Economics (Preserved for peer-to-peer barter option)
    INITIAL_USER_CREDITS: int = 10
    CREDIT_COST_PER_REQUEST: int = 2
    CREDIT_REWARD_PER_EXCHANGE: int = 2

    # E-Commerce Delivery Rate Defaults (Configurable by admin)
    DEFAULT_BASE_DELIVERY_FEE: float = 35.0      # Base charge for first 15 km
    DEFAULT_PER_KM_RATE: float = 1.80            # ₹ per km beyond 15 km
    DEFAULT_PER_250G_RATE: float = 5.0           # ₹ per 250g beyond 500g
    DEFAULT_MIN_DELIVERY_CHARGE: float = 30.0
    DEFAULT_FREE_DELIVERY_THRESHOLD: float = 800.0  # Free shipping on orders over ₹800

    # Default Campus / City Hub
    DEFAULT_PINCODE: str = "560001"  # Bengaluru Central
    DEFAULT_CITY: str = "Bengaluru"
    DEFAULT_STATE: str = "Karnataka"

settings = Settings()
