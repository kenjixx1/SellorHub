"""
Store schemas for store management.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


class StoreBase(BaseModel):
    """Base store schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    logo_url: Optional[str] = None


class StoreCreate(StoreBase):
    """Schema for creating a store."""
    slug: str = Field(..., min_length=3, max_length=50)
    
    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug is URL-friendly."""
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Slug must contain only lowercase letters, numbers, and hyphens')
        if v.startswith('-') or v.endswith('-'):
            raise ValueError('Slug cannot start or end with a hyphen')
        return v


class StoreUpdate(BaseModel):
    """Schema for updating a store."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    logo_url: Optional[str] = None


class StoreResponse(StoreBase):
    """Schema for store response."""
    id: int
    slug: str
    owner_id: int
    created_at: datetime
    product_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class StoreWithProducts(StoreResponse):
    """Schema for store with products included."""
    products: List["ProductResponse"] = []
    
    class Config:
        from_attributes = True
