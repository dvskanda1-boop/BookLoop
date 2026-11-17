# BookLoop AI – REST API Specification (Version 2.0.0)

This document details all REST API endpoints available in **BookLoop AI – Intelligent Second-Hand Book Marketplace**.

Interactive OpenAPI/Swagger documentation is also accessible at runtime at:  
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Creates a new student account, hashes password with Bcrypt | No |
| `POST` | `/api/auth/login` | Authenticates credentials and issues signed JWT | No |
| `GET` | `/api/auth/me` | Fetches authenticated student profile, PIN, and balance | Yes |
| `PUT` | `/api/auth/profile` | Updates basic profile info (name, college, location, PIN) | Yes |
| `PUT` | `/api/auth/preferences` | Updates student reading preferences for AI recommendations | Yes |

---

## 2. Pre-Owned Books & Marketplace (`/api/books`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books/categories` | Retrieves all 7 book genres/categories | No |
| `GET` | `/api/books` | Searches pre-owned books with search, category, condition, budget, and discount filters | No |
| `GET` | `/api/books/{id}` | Fetches detailed product specifications and tracks view counts | Optional |
| `GET` | `/api/books/{id}/similar` | Finds related books in the same genre | No |
| `GET` | `/api/books/curated/deals` | Fetches top bargains with 40%+ discounts below MRP | No |
| `GET` | `/api/books/curated/budget` | Returns affordable student books under ₹150 / ₹250 | No |
| `GET` | `/api/books/curated/nearby` | Surfaces books close to the buyer's PIN code | No |
| `GET` | `/api/books/my/bookshelf` | Lists all books uploaded by the current student seller | Yes |
| `POST` | `/api/books` | Lists a pre-owned book (Enforces: `selling_price < original_price`) | Yes |
| `PUT` | `/api/books/{id}` | Updates an existing listing (Only book owner or admin) | Yes |
| `DELETE` | `/api/books/{id}` | Safely deletes a book listing | Yes |

---

## 3. Distance-Based Delivery & Logistics (`/api/delivery`)

### `POST /api/delivery/estimate`
Calculates road distance, courier shipping charge, and estimated transit days between origin and destination Indian PIN codes.
- **Request Body**:
  ```json
  {
    "seller_pincode": "560001",
    "buyer_pincode": "570001",
    "weight_grams": 450,
    "book_price": 320.0
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "seller_pincode": "560001",
    "buyer_pincode": "570001",
    "seller_city": "Bengaluru",
    "buyer_city": "Mysuru",
    "distance_km": 154.2,
    "delivery_charge": 58.0,
    "estimated_days": "2-3 business days",
    "is_free_delivery": false
  }
  ```

### `GET /api/delivery/pincode-lookup/{pincode}`
Quick lookup of city, state, and geographic coordinates for any 6-digit Indian postal code.

---

## 4. E-Commerce Orders & Dispatch (`/api/orders`)

### `POST /api/orders`
Places a second-hand book order, locks single-item physical stock atomically, and logs to reading history.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "book_id": 1,
    "recipient_name": "Priya Patel",
    "recipient_phone": "9876543211",
    "shipping_address": "Hostel Block C, Room 310",
    "buyer_city": "Bengaluru",
    "buyer_state": "Karnataka",
    "buyer_pincode": "560012",
    "payment_method": "CASH_ON_DELIVERY"
  }
  ```
- **Response** (`201 Created`): Returns complete `OrderResponse` with order number (`BL-2026...`) and tracking code (`TRK-...`).

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders/my-orders` | Returns all pre-owned book purchases made by the current user | Yes |
| `GET` | `/api/orders/my-sales` | Returns all sales where the current user is seller (for dispatch) | Yes |
| `GET` | `/api/orders/{id}` | Fetches full order tracking details | Yes |
| `PUT` | `/api/orders/{id}/status` | Updates order stage (`SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`) | Yes |

---

## 5. Gemini AI Intelligence & Pricing (`/api/ai`)

### `POST /api/ai/recommend-price`
AI Smart Resale Price Recommendation endpoint for student sellers.
- **Request Body**:
  ```json
  {
    "title": "Operating System Concepts",
    "original_price": 800.0,
    "condition": "Very Good",
    "author": "Silberschatz",
    "category": "Computer Science & Engineering",
    "publication_year": 2021
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "status": "success",
    "title": "Operating System Concepts",
    "original_price": 800.0,
    "recommended_price": 320.0,
    "suggested_min_price": 280.0,
    "suggested_max_price": 360.0,
    "buyer_savings": 480.0,
    "discount_percent": 60.0,
    "condition": "Very Good",
    "rationale": "For 'Operating System Concepts' in Very Good condition, listing at ₹320 (a 60% discount) provides ₹480 in student savings while ensuring rapid sales on campus."
  }
  ```

### `GET /api/ai/shelves?pincode={pincode}`
Provides a complete set of curated recommendation shelves for the home page (*Recommended For You*, *Best Deals*, *Budget Finds*, *Books Near You*).

### `POST /api/ai/chat`
Conversational assistant powered by Google Gemini `gemini-3.5-flash-lite` with **10 live backend tools**.

---

## 6. Wishlist & Saved Books (`/api/wishlist`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/wishlist/toggle/{book_id}` | Toggles a pre-owned book in the student's saved wishlist | Yes |
| `GET` | `/api/wishlist` | Returns all books currently in the user's wishlist | Yes |

---

## 7. Customer Reviews & Ratings (`/api/reviews`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Posts a rating, review comment, and condition accuracy feedback | Yes |
| `GET` | `/api/reviews/seller/{seller_id}` | Fetches reviews and ratings for a particular seller | No |
| `GET` | `/api/reviews/book/{book_id}` | Fetches reviews associated with a specific book title | No |

---

## 8. Saved Delivery Addresses (`/api/addresses`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/addresses` | Returns all saved delivery addresses for authenticated student | Yes |
| `POST` | `/api/addresses` | Saves a new campus or home delivery address | Yes |
| `DELETE` | `/api/addresses/{id}` | Removes a saved address | Yes |

---

## 9. Admin Command Hub (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Returns platform KPIs (Users, Books, Sold Books, Total GMV, Orders) | Admin Only |
| `GET` | `/api/admin/users` | Lists all registered students, balances, and ratings | Admin Only |
| `GET` | `/api/admin/orders` | Audits all marketplace orders across the platform | Admin Only |
| `GET` | `/api/admin/delivery-rules` | Inspects active courier rate parameters | Admin Only |
| `PUT` | `/api/admin/delivery-rules` | Updates base fee, per-km rate, and free shipping threshold | Admin Only |
| `POST` | `/api/admin/users/{id}/credits` | Adjusts student credit balance with an audit trail | Admin Only |

---

## 10. Peer-to-Peer Exchanges & Credits (`/api/exchanges`, `/api/credits`)

*(Preserved for barter compatibility)*
- `POST /api/exchanges`: Requests a book barter with 2-credit escrow hold.
- `GET /api/exchanges/incoming` & `outgoing`: Exchange tracking.
- `POST /api/exchanges/{id}/accept`, `reject`, `complete`: Full barter lifecycle.
- `GET /api/credits/balance` & `transactions`: Credit wallet and ledger.
