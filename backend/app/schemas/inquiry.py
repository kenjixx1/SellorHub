"""
Inquiry schemas for buyer-seller communication.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.models.inquiry import InquiryStatus


class InquiryBase(BaseModel):
    """Base inquiry schema."""
    buyer_name: str = Field(..., min_length=1, max_length=100)
    buyer_email: EmailStr
    message: str = Field(..., min_length=1, max_length=1000)


class InquiryCreate(InquiryBase):
    """Schema for creating an inquiry."""
    product_id: int


class InquiryUpdate(BaseModel):
    """Schema for updating inquiry status."""
    status: InquiryStatus


class ProductInfo(BaseModel):
    """Product info for inquiry response."""
    id: int
    title: str
    
    class Config:
        from_attributes = True


class InquiryResponse(InquiryBase):
    """Schema for inquiry response."""
    id: int
    store_id: int
    product_id: int
    status: InquiryStatus
    created_at: datetime
    product: Optional[ProductInfo] = None
    
    class Config:
        from_attributes = True
