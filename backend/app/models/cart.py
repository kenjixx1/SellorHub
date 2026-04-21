from decimal import Decimal
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class CartItem(Base):
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


    def subtotal(self) -> Decimal:
        return Decimal(str(self.product.price)) * self.quantity

    def merge_quantity(self, additional: int) -> None:
        self.quantity += additional

    def set_quantity(self, new_quantity: int) -> None:
        if new_quantity < 1:
            raise ValueError('Quantity must be at least 1')
        self.quantity = new_quantity

    def __repr__(self):
        return f'<CartItem(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, qty={self.quantity})>'
