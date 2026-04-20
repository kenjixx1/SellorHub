"""
Product model - product listings.
"""
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class ProductStatus(str, enum.Enum):
    """Product status enumeration."""
    ACTIVE = 'active'
    SOLD = 'sold'
    HIDDEN = 'hidden'


class Product(Base):
    """
    Product entity.
    Owns domain rules for availability, stock, and pricing.
    """
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey('stores.id', ondelete='CASCADE'), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey('product_groups.id', ondelete='SET NULL'), nullable=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False, index=True)
    stock = Column(Integer, nullable=True)
    status = Column(SQLEnum(ProductStatus), nullable=False, default=ProductStatus.ACTIVE, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    store = relationship('Store', back_populates='products')
    group = relationship('ProductGroup', back_populates='products')
    images = relationship('ProductImage', back_populates='product', cascade='all, delete-orphan', order_by='ProductImage.position')
    inquiries = relationship('Inquiry', back_populates='product', cascade='all, delete-orphan')
    order_items = relationship('OrderItem', back_populates='product', passive_deletes=True)

    # ── Domain behaviour ──────────────────────────────────────────────────────

    def is_purchasable(self, quantity: int = 1) -> bool:
        """Return True when the product can be bought for the given quantity."""
        if self.status != ProductStatus.ACTIVE:
            return False
        if self.stock is not None and self.stock < quantity:
            return False
        return True

    def assert_purchasable(self, quantity: int = 1) -> None:
        """Raise ValueError if the product cannot be purchased for *quantity* units."""
        if self.status != ProductStatus.ACTIVE:
            raise ValueError(f"Product '{self.title}' is not available")
        if self.stock is not None and self.stock < quantity:
            raise ValueError(
                f"Insufficient stock for '{self.title}' (available: {self.stock})"
            )

    def line_total(self, quantity: int) -> Decimal:
        """Return price * quantity as a Decimal."""
        return Decimal(str(self.price)) * quantity

    def reserve_stock(self, quantity: int) -> None:
        """Decrement tracked stock by *quantity*. Call only after assert_purchasable."""
        if self.stock is not None:
            self.stock -= quantity

    def hide(self) -> None:
        """Mark the product as hidden (admin moderation)."""
        self.status = ProductStatus.HIDDEN

    def activate(self) -> None:
        """Restore a hidden product to active status."""
        self.status = ProductStatus.ACTIVE

    def __repr__(self):
        return f'<Product(id={self.id}, title={self.title}, price={self.price}, status={self.status})>'
