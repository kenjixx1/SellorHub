"""
Store rating routes - buyer reviews for stores.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.rating import RatingCreate, RatingUpdate, RatingResponse, StoreSummaryRating
from app.services.rating_service import RatingService

router = APIRouter(prefix="/api/ratings", tags=["Ratings"])


@router.get(
    "/store/{store_id}",
    response_model=StoreSummaryRating,
    summary="Get store ratings",
    description="Returns the average score, total count, and paginated list of ratings for a store.",
)
def get_store_ratings(
    store_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Public endpoint to view a store's ratings."""
    skip = (max(1, page) - 1) * min(limit, 100)
    return RatingService(db).get_store_ratings(store_id, skip=skip, limit=limit)


@router.post(
    "",
    response_model=RatingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Rate a store",
    description="Create a rating for a store. Requires at least one delivered order at that store.",
)
def create_rating(
    data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rate a store (buyer with completed order only)."""
    return RatingService(db).create_rating(current_user.id, data)


@router.put(
    "/{rating_id}",
    response_model=RatingResponse,
    summary="Update my rating",
    description="Update the score or comment of an existing rating.",
)
def update_rating(
    rating_id: int,
    data: RatingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an existing rating."""
    return RatingService(db).update_rating(rating_id, current_user.id, data)


@router.delete(
    "/{rating_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete my rating",
)
def delete_rating(
    rating_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an existing rating."""
    RatingService(db).delete_rating(rating_id, current_user.id)
