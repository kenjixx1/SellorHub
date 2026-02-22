"""
Product group (category) schemas.
"""
from pydantic import BaseModel, Field
from datetime import datetime


class ProductGroupBase(BaseModel):
    """Base product group schema."""
    name: str = Field(..., min_length=1, max_length=100)


class ProductGroupCreate(ProductGroupBase):
    """Schema for creating a product group."""
    pass


class ProductGroupResponse(ProductGroupBase):
    """Schema for product group response."""
    id: int
    store_id: int
    created_at: datetime
    product_count: int = 0
    
    class Config:
        from_attributes = True
