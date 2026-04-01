"""
Cart schemas for shopping cart operations.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class CartItemAdd(BaseModel):
    """Add or update an item in the cart."""
    product_id: int
    quantity: int = Field(1, ge=1)


class CartItemUpdate(BaseModel):
    """Update quantity for an existing cart item."""
    quantity: int = Field(..., ge=1)


class CartProductSnapshot(BaseModel):
    """Embedded product info inside a cart item response."""
    id: int
    title: str
    price: Decimal
    stock: Optional[int] = None
    status: str
    store_id: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class CartItemResponse(BaseModel):
    """Response for a single cart item."""
    id: int
    product_id: int
    quantity: int
    product: CartProductSnapshot
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    """Full cart response with items and totals."""
    items: List[CartItemResponse]
    total_items: int
    total_amount: Decimal
