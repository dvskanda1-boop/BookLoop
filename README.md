# BookLoop AI – Complete AI-Powered Second-Hand Book Marketplace

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Tool%20Calling%20Agent-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS%203-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-Relational%20DB-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

> *"Don't let a good book sit on a shelf. Give it a second life, and let someone else enjoy the story at a lower price."*  
> *"Read. Resell. Repeat. Every book deserves another chapter."*

**BookLoop AI** is a college-level, full-stack, AI-powered pre-owned book e-commerce platform inspired by Amazon and Flipkart, built exclusively for previously owned literature and academic textbooks.

Combining **FastAPI**, **React 18 + Vite**, **Tailwind CSS**, and **Google Gemini API Tool Calling**, BookLoop AI powers an intelligent circular book economy featuring condition-based valuation, live road-distance courier estimation, atomic single-copy stock locking, and verified student trust ratings.

---

## 🌟 Core Marketplace Features

### 1. Second-Hand Exclusivity & Enforced Fair Pricing
- Strict pricing constraint: **`selling_price < original_price`**. Listing at or above MRP is rejected by backend validation.
- Auto-calculated buyer savings in INR and percentage discount (**40% to 75% OFF** retail MRP).
- Single-item physical copy safety: When an order is placed, `is_available` is set to `False` and `is_sold` to `True` atomically, preventing duplicate purchases of unique used copies.

### 2. "Sell Your Book" Dashboard with AI Smart Resale Pricing
- Student sellers list books in under 60 seconds with title, author, ISBN, category, condition, edition, year, weight, pickup PIN code, and real image preview.
- **Gemini AI Resale Valuation Engine**:
  - Analyzes physical condition depreciation benchmarks (*Like New*, *Very Good*, *Good*, *Acceptable*).
  - Inspects comparable listings across the platform.
  - Returns a suggested fair resale price, minimum/maximum price corridor, and explanatory rationale.
  - Features a 1-click **"Apply AI Recommended Price"** button.

### 3. PIN-Code Distance & Delivery Courier Estimator
- Real-time road courier logistics engine across Indian postal zones.
- Converts 6-digit origin and destination PIN codes into geographic coordinates.
- Computes road travel distance using the Haversine formula adjusted with a **1.28x Indian road curvature multiplier**.
- Calculates delivery charge based on base fee, allowance radius, per-kilometer rate, and book weight tiers.
- Supports configurable free shipping thresholds (e.g., Free delivery on orders over ₹800).
- Displays accurate estimated transit days (e.g., *"1-2 business days"* for local, *"3-5 business days"* inter-city).

### 4. Curated Recommendation Shelves
- **Best Deals (50%+ Off MRP)**: Top pre-owned bargains.
- **Budget Reads Under ₹150 / ₹250**: Pocket-friendly student textbooks.
- **Pre-Owned Books Near You**: Prioritizes local campus and nearby city listings for minimal transit fees.
- **Recommended For You**: Personalized AI recommendations derived from user browsing and purchase history.
- **Similar Books Carousel**: Surfaces comparable editions on every product details page.

### 5. Complete E-Commerce Buying Flow
- **Product Details Page**: Photo showcase, condition rating, MRP vs Resale comparison, live PIN-code delivery fee calculator, seller card, student reviews, and instant Buy Now.
- **Shopping Cart**: Multi-item cart with aggregate delivery fee calculation.
- **Saved Delivery Addresses**: Campus hostel, home, or department addresses.
- **Flexible Checkout**: Supports *Cash on Delivery (COD)* and *Campus UPI / Instant Test Pay*.
- **Order Tracking Timeline**: 4-stage visual timeline (*Confirmed* ➔ *Shipped* ➔ *Out for Delivery* ➔ *Delivered*) with tracking codes.
- **Seller Dispatch Hub**: Student sellers manage incoming orders and mark copies as shipped.

### 6. Conversational Gemini AI Shopping & Valuation Assistant
- Powered by `gemini-3.5-flash-lite` with **10 live backend tools**.
- Can search books by keyword, recommend books by student budget, look up PIN-code delivery charges, and estimate resale pricing for potential sellers.
- Embeds interactive, clickable book cards directly in chat with direct *Add to Cart* actions.

### 7. Ratings, Reviews & Trust System
- 1 to 5 star ratings with condition accuracy feedback (*"Accurate as described"*, *"Better than expected"*).
- Verified buyer badges for reviews submitted from completed orders.
- Dynamic seller reputation ratings.

### 8. Admin Command Hub
- Platform-wide GMV (Gross Merchandise Value) metrics, order counters, and user balances.
- **Courier Delivery Rates Configuration Editor**: Real-time adjustment of base fee, per-km rate, weight surcharges, and free shipping threshold.
- Complete platform orders audit ledger.
- Credit adjustment tools for college book drives.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Python 3.10+ / 3.14 | FastAPI, Pydantic v2, Uvicorn ASGI |
| **AI Intelligence** | Google Gemini API | Official `google-genai` SDK (`gemini-3.5-flash-lite`), Automatic Function Calling |
| **Database** | SQLite + SQLAlchemy | 14 relational tables, foreign keys, cascade deletes, ACID transactions |
| **Security** | PyJWT + Bcrypt | Salted password hashing, stateless JWT Bearer authorization |
| **Frontend** | React 18 + Vite | Tailwind CSS, Lucide React icons, responsive e-commerce layout |
| **Logistics** | Python Math Engine | Haversine distance, 1.28x road curvature factor, postal zone mappings |
| **Testing** | Pytest | 13 automated tests covering pricing rules, delivery calculation, order locking, and tools |

---

## 🚀 Quick Start (Running the Application)

### Prerequisites:
- Python 3.10 or higher (virtual environment pre-configured in `venv/`)
- Node.js 18+ (production bundle pre-compiled in `frontend/dist/`)
- Google Gemini API Key configured in `.env`

### 1. Launch the Backend Server:
```powershell
.\venv\Scripts\python.exe run_backend.py
```

### 2. Open in Your Web Browser:
- **Web Application**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 👥 Demo Accounts for College Evaluation

The platform is pre-seeded with realistic second-hand listings, active orders, and ratings:

| Account Type | Email | Password | Location & PIN | Role / Function |
| :--- | :--- | :--- | :--- | :--- |
| **Student Seller / Buyer** | `arjun@college.edu` | `Student@123` | Bengaluru (560001) | Has active pre-owned listings and incoming orders |
| **Student Buyer** | `priya@college.edu` | `Student@123` | Bengaluru (560012) | Has active purchases and wishlist items |
| **Outstation Student** | `rohit@college.edu` | `Student@123` | Mysuru (570001) | Ideal for testing inter-city road distance courier calculation |
| **Platform Administrator** | `admin@bookloop.ai` | `Admin@123` | Campus Central | Access to Admin Hub, GMV stats, and Delivery Rates editor |

---

## 🧪 Running Automated Unit Tests

Execute the full pytest suite:
```powershell
.\venv\Scripts\python.exe -m pytest tests\test_backend.py -v
```
**Test Coverage Includes:**
- User authentication & password hashing
- Second-hand pricing constraint (`selling_price < original_price`)
- Distance-based delivery estimator & PIN code lookup
- AI condition depreciation resale pricing logic
- Atomic single-copy order locking & duplicate order prevention
- Wishlist toggling & verified customer reviews
- Gemini AI agent backend tools execution
- Platform statistics calculation

---

## 📦 Project Package

A complete standalone package excluding temporary cache files and virtual environments is bundled as:
- **`BookLoop_AI_SecondHand_Marketplace.zip`**
