# BookLoop AI – Testing & Quality Assurance Report

This document records the automated testing strategy, test suite results, and verification report for **BookLoop AI – Intelligent Second-Hand Book Marketplace**.

---

## 1. Automated Test Suite (Pytest)

The automated test suite is located in `tests/test_backend.py`. It tests every business rule, e-commerce flow, distance estimation, and AI tool.

### Execution Command:
```powershell
.\venv\Scripts\python.exe -m pytest tests\test_backend.py -v
```

### Complete Test Results:

| # | Test Function | What is Tested & Verified | Result |
| :--- | :--- | :--- | :--- |
| 1 | `test_login_demo_user` | Bcrypt password verification, JWT generation, and credit balance return. | **PASSED** |
| 2 | `test_login_invalid_password` | Verifies that incorrect credentials return HTTP 401 Unauthorized. | **PASSED** |
| 3 | `test_user_registration` | Verifies new student account creation, salted password hashing, and token issuance. | **PASSED** |
| 4 | `test_get_books_and_search` | Verifies marketplace catalog, category filters, and keyword search. | **PASSED** |
| 5 | `test_book_details` | Verifies product details endpoint and view count tracking. | **PASSED** |
| 6 | `test_second_hand_pricing_rule_strictly_below_mrp` | **Enforced Rule**: Verifies that trying to list a book with `selling_price >= original_price` throws HTTP 400. | **PASSED** |
| 7 | `test_distance_based_delivery_estimator` | Tests PIN code lookup, road distance (Haversine + 1.28x road factor), courier tariff calculation, and free delivery thresholds. | **PASSED** |
| 8 | `test_ai_resale_pricing_logic` | Tests condition depreciation benchmarks (*Like New*, *Very Good*, *Good*, *Acceptable*) returning fair resale pricing below MRP. | **PASSED** |
| 9 | `test_order_creation_and_atomic_stock_locking` | Places an order, verifies atomic lock (`is_available = False`, `is_sold = True`), and prevents duplicate purchases of single-copy books. | **PASSED** |
| 10 | `test_wishlist_toggle` | Verifies adding and removing pre-owned books from student wishlist. | **PASSED** |
| 11 | `test_verified_buyer_review` | Verifies verified buyer reviews and seller average rating updates. | **PASSED** |
| 12 | `test_ai_agent_tools` | Verifies backend AI tools execution (`search_books`, `get_book_details`, `recommend_books`, `check_user_credits`, `estimate_delivery`, `find_books_by_budget`). | **PASSED** |
| 13 | `test_platform_stats` | Verifies admin platform metrics, Gross Merchandise Value (GMV), and order counts. | **PASSED** |

**Summary**: **13 passed in 3.14s (100% pass rate)**.

---

## 2. Frontend Build Verification

The React + Vite production bundle compiles cleanly with zero warnings:
```
vite v6.4.6 building for production...
✓ 1593 modules transformed.
dist/index.html                   1.22 kB │ gzip:  0.69 kB
dist/assets/index-CP4v11Dm.css   45.55 kB │ gzip:  8.05 kB
dist/assets/index-CjUFTNja.js   337.61 kB │ gzip: 84.79 kB
✓ built in 4.02s
```

---

## 3. Server End-to-End Live Verification

The unified single-port architecture serves both the FastAPI REST backend and the React SPA from `frontend/dist/` at `http://127.0.0.1:8000`:
- `/api/health`: Confirms SQLite database connection and Gemini model configuration.
- `/docs`: Interactive Swagger documentation of all 12 routers and 35+ endpoints.
- `/`: Direct access to the Second-Hand Book Marketplace.
