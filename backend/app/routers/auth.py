"""
Authentication routes - registration, login, and current user info.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new buyer or seller account. Sellers require admin approval before creating a store."
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user account."""
    service = AuthService(db)
    return service.register_user(user_data)


@router.post(
    "/login",
    response_model=Token,
    summary="Login",
    description="Authenticate with email and password. Returns a JWT access token."
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login and receive JWT access token."""
    service = AuthService(db)
    return service.login_user(login_data)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Returns the profile of the currently authenticated user."
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return current_user
