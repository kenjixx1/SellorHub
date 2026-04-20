"""
Cart models - persistent shopping cart for buyers.
"""
from decimal import Decimal
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class CartItem(Base):
    """
    Cart item entity.
    Each buyer has at most one cart item row per product.
    Owns subtotal calculation and merge/update rules.
    """
    __tablename__ = 'cart_items'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship('User', backref='cart_items')
    product = relationship('Product')

    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='uq_cart_user_product'),
    )

    # ── Domain behaviour ──────────────────────────────────────────────────────

    def subtotal(self) -> Decimal:
        """Return unit price * quantity for this cart line."""
        return Decimal(str(self.product.price)) * self.quantity

    def merge_quantity(self, additional: int) -> None:
        """Increase quantity by *additional* units."""
        self.quantity += additional

    def set_quantity(self, new_quantity: int) -> None:
        """Replace quantity; raises ValueError for non-positive values."""
        if new_quantity < 1:
            raise ValueError('Quantity must be at least 1')
        self.quantity = new_quantity

    def __repr__(self):
        return f'<CartItem(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, qty={self.quantity})>'
