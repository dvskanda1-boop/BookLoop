from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, CreditTransaction, UserPreference
from backend.schemas import (
    UserRegister, UserLogin, UserResponse, Token,
    UserProfileUpdate, UserPreferenceUpdate, UserPreferenceResponse
)
from backend.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)
from backend.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Registers a new student user and provides initial welcome exchange credits."""
    # Check if email is already taken
    existing = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Hash the password securely
    hashed_pwd = hash_password(user_data.password)

    new_user = User(
        name=user_data.name.strip(),
        email=user_data.email.lower().strip(),
        hashed_password=hashed_pwd,
        college=user_data.college or "National Institute of Technology",
        location=user_data.location or "Campus Library / Hostel Block",
        credit_balance=settings.INITIAL_USER_CREDITS,
        is_admin=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initial Welcome Credits Transaction Audit Record
    welcome_tx = CreditTransaction(
        user_id=new_user.id,
        amount=settings.INITIAL_USER_CREDITS,
        balance_after=settings.INITIAL_USER_CREDITS,
        transaction_type="INITIAL_BONUS",
        description="BookLoop Welcome Credits to start exchanging books!"
    )
    db.add(welcome_tx)

    # Create default user preference
    pref = UserPreference(
        user_id=new_user.id,
        favorite_categories="Computer Science, Literature, Self-Help",
        favorite_authors="Robert C. Martin, George Orwell",
        preferred_condition="Good",
        bio=f"Student at {new_user.college} passionate about reading and sharing books."
    )
    db.add(pref)
    db.commit()
    db.refresh(new_user)

    # Issue JWT Token
    access_token = create_access_token(
        data={"sub": str(new_user.id), "email": new_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticates a student and issues a secure JWT bearer token."""
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Fetches the authenticated student's profile, balance, and preferences."""
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    update_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates basic profile fields (name, college, location)."""
    if update_data.name:
        current_user.name = update_data.name.strip()
    if update_data.college:
        current_user.college = update_data.college.strip()
    if update_data.location:
        current_user.location = update_data.location.strip()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/preferences", response_model=UserPreferenceResponse)
def update_preferences(
    pref_data: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates reading interests, favorite authors, and personal bio."""
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if pref_data.favorite_categories is not None:
        pref.favorite_categories = pref_data.favorite_categories
    if pref_data.favorite_authors is not None:
        pref.favorite_authors = pref_data.favorite_authors
    if pref_data.preferred_condition is not None:
        pref.preferred_condition = pref_data.preferred_condition
    if pref_data.bio is not None:
        pref.bio = pref_data.bio

    db.commit()
    db.refresh(pref)
    return pref
