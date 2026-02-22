"""
Order schemas for order management (Post-MVP).
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    """Schema for creating an order item."""
    product_id: int
    quantity: int = Field(..., ge=1)


class OrderItemResponse(BaseModel):
    """Schema for order item response."""
    id: int
    product_id: int
    product_title_snapshot: str
    unit_price_snapshot: Decimal
    quantity: int
    
    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    """Base order schema."""
    shipping_address_id: int


class OrderCreate(OrderBase):
    """Schema for creating an order."""
    store_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderResponse(OrderBase):
    """Schema for order response."""
    id: int
    order_number: str
    buyer_id: int
    store_id: int
    status: OrderStatus
    total_amount: Decimal
    currency: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True
