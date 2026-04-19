from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(1, ge=1)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)

class CartProductSnapshot(BaseModel):
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
    id: int
    product_id: int
    quantity: int
    product: CartProductSnapshot
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total_items: int
    total_amount: Decimal