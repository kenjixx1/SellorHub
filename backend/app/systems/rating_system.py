"""
RatingSystem - application-layer orchestration for store ratings.
"""
from decimal import Decimal
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderStatus
from app.models.store import Store
from app.models.store_rating import StoreRating
from app.schemas.rating import RatingCreate, RatingUpdate


class RatingSystem:
    """Orchestrates rating creation, update, deletion, and aggregation workflows."""

    def __init__(self, db: Session):
        self.db = db

    def _require_completed_order(self, buyer_id: int, store_id: int) -> Order:
        order = self.db.query(Order).filter(
            Order.buyer_id == buyer_id,
            Order.store_id == store_id,
            Order.status == OrderStatus.DELIVERED,
        ).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You can only rate a store after a completed (delivered) order',
            )
        return order

    def create_rating(self, buyer_id: int, data: RatingCreate) -> StoreRating:
        store = self.db.query(Store).filter(Store.id == data.store_id).first()
        if not store:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Store not found')
        self._require_completed_order(buyer_id, data.store_id)
        existing = self.db.query(StoreRating).filter(
            StoreRating.store_id == data.store_id, StoreRating.buyer_id == buyer_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='You have already rated this store. Use PUT to update.',
            )
        rating = StoreRating(
            store_id=data.store_id,
            buyer_id=buyer_id,
            order_id=data.order_id,
            score=data.score,
            comment=data.comment,
        )
        self.db.add(rating)
        self.db.commit()
        self.db.refresh(rating)
        return rating

    def update_rating(self, rating_id: int, buyer_id: int, data: RatingUpdate) -> StoreRating:
        rating = self.db.query(StoreRating).filter(
            StoreRating.id == rating_id, StoreRating.buyer_id == buyer_id
        ).first()
        if not rating:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Rating not found')
        if data.score is not None:
            rating.score = data.score
        if data.comment is not None:
            rating.comment = data.comment
        self.db.commit()
        self.db.refresh(rating)
        return rating

    def delete_rating(self, rating_id: int, buyer_id: int) -> bool:
        rating = self.db.query(StoreRating).filter(
            StoreRating.id == rating_id, StoreRating.buyer_id == buyer_id
        ).first()
        if not rating:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Rating not found')
        self.db.delete(rating)
        self.db.commit()
        return True

    def get_store_ratings(self, store_id: int, skip: int = 0, limit: int = 20) -> dict:
        q = (
            self.db.query(StoreRating)
            .options(joinedload(StoreRating.buyer))
            .filter(StoreRating.store_id == store_id)
        )
        total = q.count()
        ratings = q.order_by(StoreRating.created_at.desc()).offset(skip).limit(limit).all()
        avg_row = (
            self.db.query(func.avg(StoreRating.score))
            .filter(StoreRating.store_id == store_id)
            .scalar()
        )
        avg = round(Decimal(str(avg_row)), 2) if avg_row is not None else None
        return {
            'store_id': store_id,
            'average_score': avg,
            'total_ratings': total,
            'ratings': ratings,
        }
