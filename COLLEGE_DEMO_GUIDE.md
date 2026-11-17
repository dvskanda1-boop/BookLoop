# BookLoop AI – College Demonstration Script & Viva Walkthrough

This guide provides a structured, 5-minute step-by-step demonstration script for presenting **BookLoop AI – Intelligent Second-Hand Book Marketplace** during project exhibitions, evaluations, and external faculty vivas.

---

## 🕒 Recommended 5-Minute Demonstration Plan

### Minute 1: The Problem & Value Proposition (Opening)
- **What to say**:  
  *"Good morning professors. Today I am presenting **BookLoop AI**, a full-stack, AI-powered e-commerce platform built exclusively for second-hand books and academic literature.  
  Every semester, students spend thousands of rupees on engineering textbooks and reference materials that sit unread once the exams end. Our core philosophy is:  
  **'Don't let a good book sit on a shelf. Give it a second life, and let someone else enjoy the story at a lower price.'** and **'Read. Resell. Repeat. Every book deserves another chapter.'**  
  BookLoop AI combines modern e-commerce buying experiences with Google Gemini AI pricing intelligence and real-time distance-based courier delivery calculations."*

---

### Minute 2: "Sell Your Book" & Gemini AI Smart Resale Pricing
1. Click **Sell a Book** in the top navigation bar.
2. Fill in sample details:
   - Book Title: *Operating System Concepts*
   - Author: *Abraham Silberschatz*
   - Original MRP: *₹800*
   - Condition: *Very Good*
3. **Key Highlight – Click "Ask AI Price Advice"**:
   - Point out the AI valuation card that appears.
   - Explain to the examiners:
     *"Here, our Gemini AI pricing agent analyzes the condition depreciation benchmarks, compares similar listings across the database, and recommends listing at ₹320 with a 60% discount. Notice the 1-click 'Apply AI Recommended Price' button."*
4. Show the enforced pricing rule:
   - Try entering ₹850 in the selling price field.
   - Show the validation warning: *"Selling price must remain strictly lower than original retail MRP."*
5. Point out the **Live Buyer Preview Card** on the right side showing savings (*"Buyer Saves ₹480 (60% OFF)"*).

---

### Minute 3: Product Details & Distance-Based Delivery Estimator
1. Open any pre-owned book from the **Marketplace** (e.g. *Designing Data-Intensive Applications*).
2. Point out the e-commerce layout:
   - Original MRP strikethrough (~~₹950~~), Resale Price (**₹420**), Discount badge (**56% OFF**), and Buyer Savings badge.
   - Verified pre-owned quality guarantee checklist.
3. **Demonstrate the Live Delivery & Distance Estimator**:
   - Notice the seller is in Bengaluru (`560001`).
   - Enter Mysuru PIN code: `570001` and click **Check PIN**.
   - Show the calculated results:
     - **Road Courier Distance**: `~154 km` (using Haversine formula + 1.28x road curvature factor).
     - **Courier Delivery Fee**: `₹58`.
     - **Estimated Arrival**: `2-3 business days`.
   - Explain the mathematics: In Indian courier logistics, straight-line distance understates road travel. Our backend incorporates a 1.28x road courier multiplier.

---

### Minute 4: E-Commerce Checkout & Atomic Single-Copy Stock Locking
1. Click **Buy Now** or add the book to the **Cart**.
2. Go to the **Cart**:
   - Show the price breakdown: MRP total, second-hand subtotal, buyer savings, delivery courier fee, and net payable.
   - Select payment method (*Cash on Delivery* or *Campus UPI Simulator*).
3. Click **Place Order**:
   - Point out that because second-hand books are unique physical copies, the backend **atomically locks `is_available = False` and `is_sold = True`**, preventing any other student from double-purchasing the same book.
4. Go to **My Orders**:
   - Show the 4-stage visual timeline (*Confirmed* ➔ *Shipped* ➔ *Out for Delivery* ➔ *Delivered*).
   - Show the unique Order ID (`BL-...`) and Courier Tracking Code (`TRK-...`).
   - Switch to the **My Sales** tab to show how the seller sees the incoming order and dispatches the book.

---

### Minute 5: Conversational AI Agent & Admin Command Hub
1. Navigate to **AI Assistant**:
   - Click the prompt chip: *"Find pre-owned books under ₹200"*.
   - Point out that Gemini autonomously calls the backend tool `find_books_by_budget(max_price=200)` and renders interactive book cards directly inside the conversation!
2. Open **Admin Hub** (logged in as `admin@bookloop.ai`):
   - Show the platform GMV (Gross Merchandise Value), total orders, and circulating balances.
   - Show the **Courier Delivery Rates Configuration Editor**: demonstrate how campus admins can adjust the base fee, per-km charge, and free shipping threshold.
3. Open **Swagger API Docs** (`http://127.0.0.1:8000/docs`):
   - Show the 12+ REST API routers with over 35 modular endpoints.
4. **Closing Statement**:
   *"BookLoop AI delivers a circular e-commerce platform that reduces educational costs for students, saves paper and trees, and demonstrates real-world software engineering with generative AI tool calling. Thank you!"*
