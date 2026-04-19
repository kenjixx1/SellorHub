from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AddressBase(BaseModel):
    label: Optional[str] = Field(None, max_length=50)
    recipient_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=20)
    address_line1: str = Field(..., min_length=1, max_length=200)
    address_line2: Optional[str] = Field(None, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=10)
    country: str = Field(default='Thailand', max_length=50)
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, max_length=50)
    recipient_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    address_line1: Optional[str] = Field(None, min_length=1, max_length=200)
    address_line2: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    province: Optional[str] = Field(None, min_length=1, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=1, max_length=10)
    country: Optional[str] = Field(None, max_length=50)
    is_default: Optional[bool] = None

class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True