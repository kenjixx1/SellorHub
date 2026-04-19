from pydantic import BaseModel, Field
from datetime import datetime

class ProductImageBase(BaseModel):
    image_url: str
    position: int = Field(..., ge=0)

class ProductImageCreate(ProductImageBase):
    product_id: int

class ProductImageResponse(ProductImageBase):
    id: int
    product_id: int
    created_at: datetime

    class Config:
        from_attributes = True