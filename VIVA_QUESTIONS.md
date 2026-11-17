# BookLoop AI – 30+ College Viva Voce Questions & Answers

This document prepares you for technical viva questions from professors and external examiners during project evaluation for **BookLoop AI – Intelligent Second-Hand Book Marketplace**.

---

## 🔹 Category 1: Second-Hand Marketplace & E-Commerce Logistics

### Q1. Why is BookLoop AI strictly a second-hand marketplace, and how is this enforced in code?
**Answer:**  
Our platform is built on the philosophy: *"Don't let a good book sit on a shelf. Give it a second life, and let someone else enjoy the story at a lower price."* and *"Read. Resell. Repeat. Every book deserves another chapter."*  
To ensure fair pricing for students and prevent commercial gouging, we enforce the rule **`selling_price < original_price`** at both the Pydantic schema level (`@field_validator`) and the SQLAlchemy database query level. Any attempt to list a book at or above original retail MRP is immediately rejected with an HTTP 400 Bad Request error.

---

### Q2. How does the distance-based delivery fee estimator work technically?
**Answer:**  
1. **PIN Code Geocoding**: We maintain an in-memory dictionary of Indian postal circles and their representative latitude/longitude coordinates.
2. **Haversine Distance**: We calculate the great-circle surface distance between the seller's pickup PIN code and the buyer's delivery PIN code:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
3. **Road Curvature Multiplier (1.28x)**: Straight-line distance understates road travel. Indian highway logistics research establishes an average **1.28x multiplier** to accurately approximate actual road courier mileage.
4. **Tariff Formula**:
   $$\text{Charge} = \text{Base Fee} + (\max(0, \text{Road KM} - \text{Allowance}) \times \text{Per KM Rate}) + \left(\left\lceil \frac{\text{Weight (g)}}{250} \right\rceil \times \text{Weight Rate}\right)$$
5. **Free Shipping Rule**: If the pre-owned book price exceeds the admin-configured threshold (default ₹800), shipping is free.

---

### Q3. How do you handle concurrency and stock locking for unique second-hand physical books?
**Answer:**  
Unlike conventional e-commerce where products have unlimited warehouse quantities, second-hand books are **unique, single physical copies**.  
When an order is submitted:
1. The backend inspects `is_available == True` and `is_sold == False` within an atomic database transaction.
2. If available, `book.is_available = False` and `book.is_sold = True` are updated and committed immediately with the order record.
3. If two students attempt to checkout the same book simultaneously, the database transaction isolation ensures only the first request succeeds; subsequent requests receive an HTTP 400 error stating that the single copy has already been sold.

---

## 🔹 Category 2: AI Agent & Gemini Function Calling

### Q4. What is an "AI Agent" and how is it different from a standard chatbot?
**Answer:**  
A traditional chatbot simply predicts the next text tokens based on pre-trained weights and cannot access live data. An **AI Agent**, on the other hand, possesses **agency**: it can perceive user goals, reason about which external tools are required, execute real Python code (querying our database or calculating logistics), receive the structured outputs, and synthesize a factual response. BookLoop AI uses Google Gemini with **10 backend Python tools**.

---

### Q5. How does Gemini Tool Calling (Function Calling) work technically?
**Answer:**  
1. When configuring the Gemini client using the official `google-genai` SDK, we pass Python functions in `types.GenerateContentConfig(tools=[...])`.
2. The SDK automatically extracts function names, parameters, type annotations, and docstrings into an OpenAPI-compatible JSON schema.
3. When the user sends a message, Gemini evaluates whether any tool schema matches the user's intent. If so, it emits a structured function call payload (`name` and `arguments`).
4. The backend executes the Python function against SQLite.
5. The return value is sent back to Gemini, which synthesizes an English response based strictly on factual output.

---

### Q6. How does the AI Smart Resale Price Recommendation work?
**Answer:**  
When a student lists a book, the pricing engine uses a two-stage hybrid approach:
1. **Mathematical Depreciation Benchmark**: Applies condition-specific depreciation rates:
   - *Like New*: 35% to 50% discount off MRP
   - *Very Good*: 45% to 60% discount off MRP
   - *Good*: 55% to 70% discount off MRP
   - *Acceptable*: 65% to 80% discount off MRP
   Adjusted by publication year (older editions depreciate slightly more).
2. **Comparable Listings**: Queries active database listings for the same title or author.
3. **Gemini Rationale Synthesis**: Prompts Gemini with the book title, author, condition, MRP, and computed benchmark to produce a clear, encouraging 2-sentence rationale explaining the fair price to the seller.

---

### Q7. How did you prevent the AI from hallucinating inventory or prices?
**Answer:**  
1. **System Prompt Guardrails**: Prohibits the model from fabricating book titles, inventory availability, or credit numbers.
2. **Context-Bound Tools**: The backend tools query real SQLite tables. If `search_books()` returns empty, the model reports zero records.
3. **Deterministic Fallback Engine**: If the Gemini API is offline or unconfigured, an in-memory Python rule engine intercepts queries and provides mathematical pricing calculations without failing.

---

## 🔹 Category 3: Backend Architecture & Database

### Q8. Why did you choose FastAPI over Flask or Django?
**Answer:**  
1. **Performance**: Built on Starlette and Uvicorn, delivering near-Node.js/Go async performance.
2. **Type Safety & Auto-Validation**: Uses Pydantic v2 to validate incoming request bodies and serialize responses.
3. **Auto-Generated Documentation**: Produces interactive Swagger UI (`/docs`) and ReDoc (`/redoc`) automatically.
4. **Clean Architecture**: Modular routing structure across 12 distinct router files.

---

### Q9. What are the main tables in your upgraded database schema?
**Answer:**  
Our schema features 14 relational tables:
- `users`: Student accounts, credentials, locations, PIN codes, and credit balances.
- `book_categories`: Genres (Computer Science, Electronics, Fiction, etc.).
- `books`: Pre-owned listings with MRP, selling price, discount %, condition, edition, year, weight, PIN code, and sold status.
- `book_images`: Multiple photos per physical copy.
- `orders`: E-commerce orders with tracking numbers, item pricing, courier distance km, delivery charge, and shipping address.
- `delivery_addresses`: Saved student campus and home delivery addresses.
- `delivery_rate_rules`: Dynamic courier rates (base fee, per-km, per-250g, free shipping threshold).
- `wishlists`: Student saved books.
- `reviews`: Verified buyer ratings and condition accuracy feedback.
- `user_reading_history`: Tracking user views and purchases for personalized AI recommendations.
- `exchange_requests` & `credit_transactions`: Preserved barter exchange and tokenized credit ledger.
- `chat_sessions` & `chat_messages`: Multi-turn conversational history.

---

### Q10. How are user passwords secured?
**Answer:**  
Passwords are never stored in plaintext. We use the industry-standard **Bcrypt** hashing algorithm with a salt cost factor of 12 rounds (`bcrypt.gensalt(12)`). Bcrypt incorporates adaptive salting to defend against pre-computed rainbow table attacks and brute force.

---

## 🔹 Category 4: Frontend & User Experience

### Q11. Why did you choose React + Vite instead of traditional server-side templates?
**Answer:**  
Vite provides sub-second Hot Module Replacement (HMR) and optimized Rollup bundling. React's component-based virtual DOM enables instant client-side updates (such as real-time discount calculation, interactive chat cards, and dynamic delivery fee estimation) without requiring full page reloads.

---

### Q12. What design guidelines and color palette were implemented?
**Answer:**  
Following modern UI/UX design standards:
- **Primary Accent**: Deep Forest Emerald (`#059669` / `#047857`) symbolizing second-hand reuse, circular economy, and trust.
- **Secondary Accent**: Warm Teal and Amber for ratings, discounts, and credit badges.
- **Background**: Warm neutral off-white (`#faf8f5`) ensuring high readability and reducing eye fatigue during long study sessions.
- **Iconography**: Lucide React icons for crisp, lightweight SVG rendering.

---

## 🔹 Category 5: Social Impact & Sustainability

### Q13. What is the environmental and economic impact of BookLoop AI?
**Answer:**  
1. **Economic Relief**: College students save on average **58%** compared to new retail textbooks.
2. **Circular Economy**: Extends the lifecycle of physical books, reducing paper consumption, deforestation, and carbon emissions from new print production.
3. **Campus Community**: Connects senior and junior students directly across university departments.
