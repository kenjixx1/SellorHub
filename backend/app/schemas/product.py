"""
Product schemas for product management.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.models.product import ProductStatus


class ProductBase(BaseModel):
    """Base product schema."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, decimal_places=2)
    stock: Optional[int] = Field(None, ge=0)
    status: ProductStatus = ProductStatus.ACTIVE
    group_id: Optional[int] = None


class ProductCreate(ProductBase):
    """Schema for creating a product."""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating a product."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    stock: Optional[int] = Field(None, ge=0)
    status: Optional[ProductStatus] = None
    group_id: Optional[int] = None


class ProductImageResponse(BaseModel):
    """Schema for product image in product response."""
    id: int
    image_url: str
    position: int
    
    class Config:
        from_attributes = True


class ProductResponse(ProductBase):
    """Schema for product response."""
    id: int
    store_id: int
    created_at: datetime
    updated_at: datetime
    images: List[ProductImageResponse] = []
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for paginated product list."""
    products: List[ProductResponse]
    total: int
    page: int
    pages: int
