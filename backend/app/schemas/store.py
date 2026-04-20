from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re

_SLUG_RE = re.compile(r'^[a-z0-9-]+$')


def validate_slug_format(value: str) -> tuple[bool, str]:
    """Return (is_valid, error_message). error_message is empty when valid."""
    if not _SLUG_RE.match(value):
        return False, 'Slug must contain only lowercase letters, numbers, and hyphens'
    if value.startswith('-') or value.endswith('-'):
        return False, 'Slug cannot start or end with a hyphen'
    return True, ''


class StoreBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    logo_url: Optional[str] = None

class StoreCreate(StoreBase):
    slug: str = Field(..., min_length=3, max_length=50)

    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: str) -> str:
        valid, msg = validate_slug_format(v)
        if not valid:
            raise ValueError(msg)
        return v


class SlugCheckResponse(BaseModel):
    slug: str
    valid: bool
    available: bool

class StoreUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    logo_url: Optional[str] = None

class StoreResponse(StoreBase):
    id: int
    slug: str
    owner_id: int
    created_at: datetime
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True

class StoreWithProducts(StoreResponse):
    products: List['ProductResponse'] = []

    class Config:
        from_attributes = True