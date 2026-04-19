from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_title_snapshot: str
    unit_price_snapshot: Decimal
    quantity: int
    product_image_url: Optional[str] = None

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    shipping_address_id: int

class OrderCreate(OrderBase):
    store_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1)

class CheckoutFromCart(BaseModel):
    store_id: int
    shipping_address_id: int

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: Optional[str] = None

class OrderResponse(OrderBase):
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