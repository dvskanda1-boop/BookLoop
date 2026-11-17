# BookLoop AI – System Architecture & Technical Design Document

This document details the software architecture, relational data models, AI agent integration, road courier logistics mathematics, and concurrency safeguards of **BookLoop AI – Intelligent Second-Hand Book Marketplace**.

---

## 1. High-Level Multi-Tier Architecture

BookLoop AI employs a decoupled, asynchronous multi-tier architecture built with modern Python and React:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Client-Side React SPA (Vite)                          │
│   (Tailwind CSS, Lucide Icons, AuthContext, CartContext, Responsive UI)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON REST APIs (35+ Endpoints)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Application Server                         │
│  - Stateless JWT Bearer Authentication & Salted Bcrypt Password Hashing     │
│  - 12 Modular Routers (Auth, Books, Orders, Delivery, Reviews, Wishlist...) │
│  - Pydantic v2 Request/Response Validation & Enforced Pricing Constraints   │
│  - SQLAlchemy 2.0 ORM with Thread-Safe Connection Management                │
└──────────────┬───────────────────────┬───────────────────────────────┬──────┘
               │                       │                               │
               ▼                       ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────┐
│      Google Gemini API      │ │    Road Distance Courier    │ │ SQLite ORM  │
│ - Model:                    │ │       Logistics Engine      │ │  Database   │
│   gemini-3.5-flash-lite     │ │ - Indian PIN-code geocoding │ │ - 14 Tables │
│ - AFC Tool Calling (10 tools│ │ - Haversine Great Circle km │ │ - ACID      │
│ - Resale Price Recommendation│ │ - 1.28x Road Multiplier     │ │   atomic    │
│ - Curated shelf suggestions │ │ - Tiered Courier Tariffs    │ │   locking   │
└──────────────┬──────────────┘ └─────────────────────────────┘ └─────────────┘
               │
               │ Automatic Function Calling (AFC)
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Backend AI Agent Tools Suite (10 Tools)                  │
│  - search_books_db()                - find_books_by_budget_db()             │
│  - get_book_details_db()            - get_resale_price_advice_db()          │
│  - recommend_books_db()             - estimate_delivery_db()                │
│  - check_user_credits_db()          - get_my_books_db()                     │
│  - search_by_category_db()          - get_exchange_status_db()              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Relational Database Schema & Data Models

The database schema comprises **14 relational tables** managed through SQLAlchemy ORM:

```
                  ┌───────────────┐
                  │     Users     │
                  └───┬───────┬───┘
                      │       │
       ┌──────────────┘       └──────────────┐
       ▼                                     ▼
┌──────────────┐                       ┌──────────────┐
│    Books     │                       │    Orders    │
└───┬──────────┘                       └───┬──────────┘
    │                                      │
    ├──────────────┬──────────────┐        ├────────────────┐
    ▼              ▼              ▼        ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐
│  BookImages  │ │   Wishlist   │ │   Reviews    │ │DeliveryAddress │
└──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘
```

### Table Breakdown:
1. **`users`**: Identity, email, password hash, credit balance, campus location, PIN code, and admin flag.
2. **`book_categories`**: Academic categories (Computer Science, Mathematics, Fiction, etc.).
3. **`books`**:
   - `original_price` (MRP in INR)
   - `selling_price` (Must be strictly lower than MRP)
   - `discount_percent` (Computed discount below MRP)
   - `condition` (*Like New*, *Very Good*, *Good*, *Acceptable*)
   - `edition`, `publication_year`, `pages`, `weight_grams`
   - `pickup_pincode`, `pickup_city`
   - `is_available`, `is_sold`
4. **`orders`**: E-commerce order record tracking buyer, seller, single-copy book, item price, road distance km, courier charge, total amount, shipping address, and tracking status timeline.
5. **`delivery_addresses`**: Saved student campus and home delivery addresses with default flags.
6. **`delivery_rate_rules`**: Configurable courier tariffs (base fee, allowance radius, per-km rate, weight surcharge, free shipping threshold).
7. **`reviews`**: Ratings (1-5 stars), condition accuracy feedback, and verified purchase flags.
8. **`user_reading_history`**: Tracks student views and purchases to train personalized recommendation shelves.
9. **`exchange_requests` & `credit_transactions`**: Preserved barter exchange and tokenized credit ledger.
10. **`chat_sessions` & `chat_messages`**: Persistent conversational history.

---

## 3. Distance-Based Courier Logistics Engine

Indian courier logistics differs from simple straight-line flight paths. The logistics service implements:

### 1. Haversine Formula for Surface Distance:
$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$\text{Distance}_{\text{air}} = R \cdot c \quad (\text{where } R = 6371.0 \text{ km})$$

### 2. Road Curvature Multiplier ($1.28\times$):
In Indian geography and road transport, highway routing adds approximately **28%** over aerial distance:
$$\text{Distance}_{\text{road}} = \text{round}(\text{Distance}_{\text{air}} \times 1.28, 1)$$

### 3. Tariff Computation:
$$\text{Charge} = \max\left(\text{MinCharge}, \text{BaseFee} + \max(0, \text{Distance}_{\text{road}} - 15) \times \text{PerKM} + \left\lceil \frac{\text{Weight}}{250} \right\rceil \times \text{WeightRate}\right)$$

---

## 4. Single-Item Concurrency & Stock Locking

In second-hand marketplaces, books are unique individual copies rather than mass-produced inventory. To prevent race conditions and duplicate sales:

1. **Transactional Stock Check**:
   ```python
   book = db.query(Book).filter(Book.id == order_in.book_id).first()
   if not book.is_available or book.is_sold:
       raise HTTPException(status_code=400, detail="This physical copy has already been sold.")
   ```
2. **Immediate Lock**:
   ```python
   book.is_available = False
   book.is_sold = True
   # Order created and committed in the same database transaction
   db.commit()
   ```
3. If an order is later cancelled by the seller or admin, the book's availability is safely restored:
   ```python
   book.is_available = True
   book.is_sold = False
   db.commit()
   ```

---

## 5. Security & Authentication Model

- **Password Hashing**: Bcrypt with 12 adaptive rounds (`bcrypt.gensalt(12)`).
- **Session Tokens**: Stateless JSON Web Tokens (JWT) signed with `HS256` containing `sub` (user_id) and expiration timestamps.
- **Authorization Scopes**: Role-based access control via FastAPI dependency injection:
  - `get_optional_current_user`: Allows anonymous browsing of marketplace.
  - `get_current_user`: Enforces authentication for checkout, selling, and orders.
  - `get_current_admin`: Restricts GMV statistics, user management, and courier rate editing to platform administrators.
