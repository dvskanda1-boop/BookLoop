import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import (
    User, BookCategory, Book, BookImage, Order, DeliveryAddress,
    DeliveryRateRule, Wishlist, Review, UserReadingHistory,
    ExchangeRequest, CreditTransaction, UserPreference
)
from backend.auth import hash_password
from backend.config import settings

def seed_database(force_recreate: bool = False):
    """Initializes tables and seeds rich second-hand marketplace demo data."""
    if force_recreate:
        print("Recreating database tables for upgraded second-hand marketplace schema...")
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if books already have selling_price to see if migration is needed
        existing_books = db.query(Book).first()
        if existing_books and hasattr(existing_books, 'selling_price') and existing_books.selling_price > 0:
            print("Database already contains second-hand marketplace data. Skipping initial seed.")
            return

        print("Fresh database schema initialization for Second-Hand Marketplace...")
        # Clear out old partial data if upgrading
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        print("1. Seeding Delivery Rate Rules...")
        delivery_rule = DeliveryRateRule(
            name="Standard Campus Courier Slab",
            base_fee=35.0,
            base_km_allowance=15.0,
            per_km_rate=1.80,
            per_250g_rate=5.0,
            min_delivery_charge=30.0,
            free_delivery_threshold=800.0,
            is_active=True
        )
        db.add(delivery_rule)
        db.commit()

        print("2. Seeding Book Categories...")
        categories_data = [
            ("Computer Science & Engineering", "Programming, Algorithms, Systems, and AI textbooks", "code", "cs-eng"),
            ("Mathematics & Data Science", "Calculus, Linear Algebra, Statistics, and Machine Learning", "calculator", "math-ds"),
            ("Literature & Fiction", "Classic literature, modern novels, and thought-provoking fiction", "book-open", "fiction"),
            ("Business & Economics", "Management, entrepreneurship, finance, and economics", "briefcase", "business"),
            ("Self-Help & Personal Growth", "Productivity, psychology, communication, and mindset", "sparkles", "self-help"),
            ("Science & Healthcare", "Physics, Chemistry, Biology, and Medical sciences", "atom", "science"),
            ("Humanities & Social Sciences", "History, Philosophy, Sociology, and Political Science", "globe", "humanities")
        ]

        cat_map = {}
        for name, desc, icon, slug in categories_data:
            c = BookCategory(name=name, description=desc, icon=icon, slug=slug)
            db.add(c)
            db.commit()
            db.refresh(c)
            cat_map[name] = c.id

        print("3. Seeding Demo Users...")
        # 1. Admin
        admin = User(
            name="BookLoop Administrator",
            email="admin@bookloop.ai",
            hashed_password=hash_password("Admin@123"),
            phone="+91 98888 11111",
            college="National Institute of Technology",
            city="Bengaluru",
            pincode="560001",
            location="Admin Block, Central Library",
            credit_balance=50,
            seller_rating=5.0,
            total_ratings=12,
            is_admin=True,
            is_verified_seller=True
        )
        db.add(admin)

        # 2. Student Arjun (Bengaluru, Koramangala 560034)
        arjun = User(
            name="Arjun Sharma",
            email="arjun@college.edu",
            hashed_password=hash_password("Student@123"),
            phone="+91 98765 12345",
            college="National Institute of Technology",
            city="Bengaluru",
            pincode="560034",
            location="Koramangala 4th Block, Bengaluru",
            credit_balance=14,
            seller_rating=4.9,
            total_ratings=8,
            is_admin=False,
            is_verified_seller=True
        )
        db.add(arjun)

        # 3. Student Priya (Mysuru, Jayalakshmipuram 570006)
        priya = User(
            name="Priya Patel",
            email="priya@college.edu",
            hashed_password=hash_password("Student@123"),
            phone="+91 97654 23456",
            college="National Institute of Engineering",
            city="Mysuru",
            pincode="570006",
            location="Jayalakshmipuram, Mysuru",
            credit_balance=18,
            seller_rating=4.8,
            total_ratings=6,
            is_admin=False,
            is_verified_seller=True
        )
        db.add(priya)

        # 4. Student Rohit (Bengaluru, Basavanagudi 560004)
        rohit = User(
            name="Rohit Kumar",
            email="rohit@college.edu",
            hashed_password=hash_password("Student@123"),
            phone="+91 96543 34567",
            college="BMS College of Engineering",
            city="Bengaluru",
            pincode="560004",
            location="Basavanagudi, Bengaluru",
            credit_balance=10,
            seller_rating=4.7,
            total_ratings=5,
            is_admin=False,
            is_verified_seller=True
        )
        db.add(rohit)

        db.commit()
        db.refresh(admin)
        db.refresh(arjun)
        db.refresh(priya)
        db.refresh(rohit)

        # Seed Saved Delivery Addresses
        db.add(DeliveryAddress(
            user_id=arjun.id,
            label="Hostel Room",
            recipient_name="Arjun Sharma",
            phone="+91 98765 12345",
            street_address="Hostel Block A, Room 204, Campus Grounds",
            pincode="560034",
            city="Bengaluru",
            state="Karnataka",
            is_default=True
        ))
        db.add(DeliveryAddress(
            user_id=priya.id,
            label="Home / Campus",
            recipient_name="Priya Patel",
            phone="+91 97654 23456",
            street_address="#45 2nd Main, Temple Road, Jayalakshmipuram",
            pincode="570006",
            city="Mysuru",
            state="Karnataka",
            is_default=True
        ))
        db.add(DeliveryAddress(
            user_id=rohit.id,
            label="Residence",
            recipient_name="Rohit Kumar",
            phone="+91 96543 34567",
            street_address="12 Bull Temple Road, Basavanagudi",
            pincode="560004",
            city="Bengaluru",
            state="Karnataka",
            is_default=True
        ))
        db.commit()

        # Seed User Preferences
        for u, cats, authors, bio in [
            (arjun, "Computer Science & Engineering, Mathematics & Data Science", "Robert C. Martin, Martin Kleppmann", "CS junior enthusiastic about distributed systems and cloud architecture."),
            (priya, "Mathematics & Data Science, Self-Help & Personal Growth", "James Clear, Gilbert Strang", "Data Science student passionate about machine learning and habit building."),
            (rohit, "Literature & Fiction, Business & Economics", "George Orwell, Morgan Housel", "Passionate about literature, economics, and campus book sharing.")
        ]:
            db.add(UserPreference(
                user_id=u.id,
                favorite_categories=cats,
                favorite_authors=authors,
                preferred_condition="Good",
                bio=bio
            ))
            db.add(CreditTransaction(
                user_id=u.id,
                amount=10,
                balance_after=10,
                transaction_type="INITIAL_BONUS",
                description="BookLoop Welcome Credits"
            ))
        db.commit()

        print("4. Seeding Pre-Owned Books with Realistic Second-Hand Pricing...")
        books_data = [
            # Title, Author, ISBN, Desc, Cat, Condition, MRP, SellingPrice, Edition, Year, Pages, Weight, Pincode, City, State, LocationDesc, Image, OwnerId
            (
                "Designing Data-Intensive Applications",
                "Martin Kleppmann",
                "9781449373320",
                "The definitive guide to distributed data systems, storage engines, stream processing, and system reliability. Pristine condition with no markings.",
                cat_map["Computer Science & Engineering"],
                "Like New",
                1200.0, 550.0,
                "1st Edition", 2022, 616, 520,
                "560034", "Bengaluru", "Karnataka", "Koramangala 4th Block",
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
                arjun.id
            ),
            (
                "Clean Code: A Handbook of Agile Software Craftsmanship",
                "Robert C. Martin",
                "9780132350884",
                "Essential best practices for professional software engineering, readability, and refactoring. Light pencil markings on Chapter 3.",
                cat_map["Computer Science & Engineering"],
                "Very Good",
                899.0, 399.0,
                "2nd Edition", 2021, 464, 480,
                "560034", "Bengaluru", "Karnataka", "Koramangala 4th Block",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400",
                arjun.id
            ),
            (
                "Introduction to Algorithms (CLRS 3rd Edition)",
                "Thomas H. Cormen",
                "9780262033848",
                "Standard engineering textbook on data structures, dynamic programming, graph algorithms, and complexity. Used for 2 semesters, all pages intact.",
                cat_map["Computer Science & Engineering"],
                "Good",
                1495.0, 599.0,
                "3rd International Edition", 2020, 1312, 1100,
                "570006", "Mysuru", "Karnataka", "Jayalakshmipuram",
                "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400",
                priya.id
            ),
            (
                "Artificial Intelligence: A Modern Approach (4th Ed)",
                "Stuart Russell & Peter Norvig",
                "9780134610993",
                "The preeminent university textbook on artificial intelligence, search algorithms, logic, and neural networks. Barely opened, crisp binding.",
                cat_map["Computer Science & Engineering"],
                "Like New",
                1600.0, 750.0,
                "4th Global Edition", 2023, 1152, 950,
                "560004", "Bengaluru", "Karnataka", "Basavanagudi",
                "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400",
                rohit.id
            ),
            # Mathematics & Data Science
            (
                "Linear Algebra and Its Applications",
                "Gilbert Strang",
                "9780030105678",
                "World-renowned MIT textbook on matrix decomposition, eigenvalues, and vectors for machine learning. Clean pages.",
                cat_map["Mathematics & Data Science"],
                "Good",
                750.0, 280.0,
                "4th Edition", 2019, 500, 480,
                "570006", "Mysuru", "Karnataka", "Jayalakshmipuram",
                "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400",
                priya.id
            ),
            (
                "Python for Data Analysis (3rd Edition)",
                "Wes McKinney",
                "9781098104030",
                "Practical guide by the creator of pandas for data wrangling, NumPy, and statistical plotting. Excellent pre-owned condition.",
                cat_map["Mathematics & Data Science"],
                "Like New",
                1100.0, 499.0,
                "3rd Edition", 2022, 550, 520,
                "560034", "Bengaluru", "Karnataka", "Koramangala",
                "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400",
                arjun.id
            ),
            # Self-Help & Personal Growth
            (
                "Atomic Habits",
                "James Clear",
                "9780735211292",
                "Proven framework for building good habits and mastering tiny behaviors. Read once, condition is pristine.",
                cat_map["Self-Help & Personal Growth"],
                "Like New",
                799.0, 350.0,
                "Hardcover Edition", 2021, 320, 360,
                "570006", "Mysuru", "Karnataka", "Jayalakshmipuram",
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
                priya.id
            ),
            (
                "Deep Work: Rules for Focused Success",
                "Cal Newport",
                "9781455586691",
                "How to master cognitive focus in a distracted world and produce elite creative and academic output.",
                cat_map["Self-Help & Personal Growth"],
                "Very Good",
                499.0, 199.0,
                "Reprint Edition", 2020, 304, 310,
                "560004", "Bengaluru", "Karnataka", "Basavanagudi",
                "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400",
                rohit.id
            ),
            # Business & Economics
            (
                "The Psychology of Money",
                "Morgan Housel",
                "9780857197689",
                "Timeless lessons on wealth, greed, and happiness exploring how people actually think about money.",
                cat_map["Business & Economics"],
                "Like New",
                399.0, 160.0,
                "Paperback Edition", 2022, 252, 260,
                "560004", "Bengaluru", "Karnataka", "Basavanagudi",
                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400",
                rohit.id
            ),
            (
                "Zero to One: Notes on Startups",
                "Peter Thiel",
                "9780804139298",
                "Insights on building the future, escaping competition, and creating transformative new technology ventures.",
                cat_map["Business & Economics"],
                "Good",
                450.0, 175.0,
                "First Edition", 2018, 224, 250,
                "560034", "Bengaluru", "Karnataka", "Koramangala",
                "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=400",
                arjun.id
            ),
            # Literature & Fiction
            (
                "1984",
                "George Orwell",
                "9780451524935",
                "The classic dystopian masterpiece exploring totalitarianism, surveillance, truth, and human freedom.",
                cat_map["Literature & Fiction"],
                "Good",
                299.0, 99.0,  # Under ₹100 deal!
                "Centennial Edition", 2019, 328, 280,
                "560004", "Bengaluru", "Karnataka", "Basavanagudi",
                "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
                rohit.id
            ),
            (
                "To Kill a Mockingbird",
                "Harper Lee",
                "9780061120084",
                "Pulitzer Prize-winning classic novel on integrity, justice, empathy, and coming of age in the American South.",
                cat_map["Literature & Fiction"],
                "Acceptable",
                350.0, 95.0,  # Under ₹100 deal!
                "Vintage Classics", 2017, 336, 290,
                "570006", "Mysuru", "Karnataka", "Jayalakshmipuram",
                "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400",
                priya.id
            )
        ]

        created_books = []
        for title, author, isbn, desc, cat_id, cond, mrp, sell_price, edition, pub_year, pages, weight, pin, city, state, loc_desc, img, owner_id in books_data:
            disc_pct = round(((mrp - sell_price) / mrp) * 100.0, 1)
            b = Book(
                title=title,
                author=author,
                isbn=isbn,
                description=desc,
                category_id=cat_id,
                condition=cond,
                original_price=mrp,
                selling_price=sell_price,
                discount_percent=disc_pct,
                edition=edition,
                publication_year=pub_year,
                pages=pages,
                language="English",
                weight_grams=weight,
                pickup_pincode=pin,
                pickup_city=city,
                pickup_state=state,
                pickup_location_desc=loc_desc,
                image_url=img,
                is_available=True,
                is_sold=False,
                owner_id=owner_id,
                exchange_count=1 if "Atomic" in title else 0,
                views_count=15 if "Atomic" in title or "Designing" in title else 5
            )
            db.add(b)
            db.commit()
            db.refresh(b)
            created_books.append(b)

        print("5. Seeding Sample Completed Order & Reviews...")
        # Order demo: Rohit bought Zero to One from Arjun
        zero_to_one = next(b for b in created_books if "Zero to One" in b.title)
        sample_order = Order(
            order_number=f"BL-2026-DEMO01",
            buyer_id=rohit.id,
            seller_id=arjun.id,
            book_id=zero_to_one.id,
            book_price=175.0,
            original_mrp=450.0,
            delivery_charge=35.0,
            total_amount=210.0,
            delivery_distance_km=7.5,
            recipient_name="Rohit Kumar",
            recipient_phone="+91 96543 34567",
            buyer_pincode="560004",
            buyer_city="Bengaluru",
            buyer_state="Karnataka",
            shipping_address="12 Bull Temple Road, Basavanagudi, Bengaluru",
            payment_method="CASH_ON_DELIVERY",
            payment_status="PAID",
            status="DELIVERED",
            tracking_number="TRK-BL-88912",
            estimated_delivery_date="Delivered on 14 Nov 2026"
        )
        db.add(sample_order)
        db.commit()
        db.refresh(sample_order)

        # Seed verified review
        db.add(Review(
            book_id=zero_to_one.id,
            order_id=sample_order.id,
            seller_id=arjun.id,
            buyer_id=rohit.id,
            rating=5,
            comment="Excellent second-hand condition! The book was packaged carefully and arrived in just 2 days. Saved almost 60% compared to MRP.",
            condition_rating="Better than expected",
            is_verified_purchase=True
        ))

        # Seed sample wishlist
        atomic_habits = next(b for b in created_books if "Atomic Habits" in b.title)
        db.add(Wishlist(
            user_id=arjun.id,
            book_id=atomic_habits.id
        ))

        db.commit()
        print("Database successfully seeded with upgraded second-hand marketplace data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force_recreate=True)
