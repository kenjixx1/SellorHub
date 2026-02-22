"""
Product image schemas.
"""
from pydantic import BaseModel, Field
from datetime import datetime


class ProductImageBase(BaseModel):
    """Base product image schema."""
    image_url: str
    position: int = Field(..., ge=0)


class ProductImageCreate(ProductImageBase):
    """Schema for creating a product image."""
    product_id: int


class ProductImageResponse(ProductImageBase):
    """Schema for product image response."""
    id: int
    product_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
