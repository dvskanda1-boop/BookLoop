# BookLoop AI – Complete End-User Guide

Welcome to **BookLoop AI – Intelligent Second-Hand Book Marketplace**!  
*"Don't let a good book sit on a shelf. Give it a second life, and let someone else enjoy the story at a lower price."*  
*"Read. Resell. Repeat. Every book deserves another chapter."*

---

## 1. Getting Started: Account Creation & Sign In

### Quick Login for Demonstrations:
On the Sign In page, four 1-click persona buttons are available:
- **Arjun Sharma** (`arjun@college.edu`): Student seller with active pre-owned listings and incoming orders in Bengaluru (`560001`).
- **Priya Patel** (`priya@college.edu`): Student buyer with wishlist items in Bengaluru (`560012`).
- **Rohit Verma** (`rohit@college.edu`): Outstation student in Mysuru (`570001`), ideal for testing inter-city road distance courier calculations.
- **Administrator** (`admin@bookloop.ai`): Administrative command hub access.

---

## 2. Selling a Pre-Owned Book & AI Smart Valuation

1. Click **Sell a Book** in the navigation bar.
2. Enter your book details:
   - **Title & Author**
   - **Category** (Computer Science, Business, Fiction, etc.)
   - **Condition** (*Like New*, *Very Good*, *Good*, *Acceptable*)
   - **Original Retail Price / MRP (₹)**
3. **Get AI Resale Valuation**:
   - Click the **"Ask AI Price Advice"** button.
   - Google Gemini AI analyzes physical condition depreciation benchmarks and comparable listings across BookLoop AI.
   - It suggests a fair resale price, a healthy price range, and a rationale.
   - Click **"Apply AI Recommended Price"** to auto-fill your selling price!
4. **Fair Pricing Validation**:
   - As a second-hand marketplace, selling price must remain strictly lower than retail MRP.
   - The form automatically calculates and previews buyer savings and discount percentage.
5. Provide your pickup PIN code and city, review the live buyer preview card, and click **Publish Pre-Owned Listing**.

---

## 3. Browsing the Marketplace & Estimating Delivery

1. Navigate to **Marketplace** or explore the curated shelves on the **Home** page:
   - **Best Deals (50%+ Off MRP)**
   - **Budget Finds Under ₹150 / ₹250**
   - **Pre-Owned Books Near You**
2. Filter by category, physical condition, budget ceiling, and minimum discount percentage.
3. Click any book to view its **Product Details Page**:
   - View MRP vs resale price and savings badges.
   - Check the physical condition inspection checklist.
   - **Live Delivery Estimator**: Type your 6-digit Indian PIN code to see calculated road courier distance in kilometers, delivery fee, and estimated transit days.

---

## 4. Shopping Cart & E-Commerce Checkout

1. Click **Add to Cart** or **Buy Now** on any pre-owned book.
2. Open your **Cart**:
   - Select an existing campus/home delivery address or add a new one.
   - Review live courier delivery charges calculated for your destination PIN code.
   - Choose your payment option: **Cash on Delivery (COD)** or **Campus UPI Simulator**.
3. Click **Place Order**:
   - Because second-hand books are unique physical copies, BookLoop AI atomically locks the listing from duplicate purchases.
   - An order number (`BL-...`) and courier tracking number (`TRK-...`) are immediately generated.

---

## 5. Order Tracking & Seller Dispatch

1. Navigate to **Orders**:
   - **My Purchases Tab**: Track your order along a visual 4-stage timeline (*Confirmed* ➔ *Shipped* ➔ *Out for Delivery* ➔ *Delivered*).
   - Rate the seller and leave condition accuracy feedback once your copy arrives.
   - **My Sales Tab**: For student sellers to view customer shipping addresses and mark packages as *Shipped* and *Delivered*.

---

## 6. Conversational AI Shopping & Pricing Assistant

1. Click **AI Assistant** in the navigation bar.
2. Ask natural language questions like:
   - *"Find pre-owned books under ₹200"*
   - *"What price should I sell my engineering textbook for?"*
   - *"Estimate delivery charge from 560001 to 570001"*
   - *"Show me best deals in Computer Science with over 50% discount"*
3. The AI executes real backend tools against SQLite and embeds interactive book cards directly in the conversation with 1-click *Add to Cart* buttons.

---

## 7. Admin Command Hub

Logged-in administrators can access `/admin` to:
- Monitor Gross Merchandise Value (GMV), active book counts, and completed orders.
- Edit **Courier Delivery Rate Rules** (base fee, per-km rate, weight surcharge, and free shipping threshold).
- Review all marketplace orders and adjust student credits with an audit trail.
