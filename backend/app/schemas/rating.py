from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class RatingCreate(BaseModel):
    store_id: int
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)
    order_id: Optional[int] = None

class RatingUpdate(BaseModel):
    score: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)

class RatingBuyerInfo(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class RatingResponse(BaseModel):
    id: int
    store_id: int
    buyer_id: int
    order_id: Optional[int] = None
    score: int
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    buyer: Optional[RatingBuyerInfo] = None

    class Config:
        from_attributes = True

class StoreSummaryRating(BaseModel):
    store_id: int
    average_score: Optional[Decimal] = None
    total_ratings: int
    ratings: List[RatingResponse] = []