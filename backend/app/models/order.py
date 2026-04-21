from decimal import Decimal
from typing import Optional, Set
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class OrderStatus(str, enum.Enum):
    PLACED = 'placed'
    PAID = 'paid'
    PACKING = 'packing'
    SHIPPED = 'shipped'
    DELIVERED_PENDING_CONFIRM = 'delivered_pending_confirm'
    DELIVERED = 'delivered'
    CANCELLED = 'cancelled'
    REFUNDED = 'refunded'


_SELLER_TRANSITIONS: dict[OrderStatus, Set[OrderStatus]] = {
    OrderStatus.PLACED: {OrderStatus.PACKING, OrderStatus.CANCELLED},
    OrderStatus.PAID: {OrderStatus.PACKING, OrderStatus.CANCELLED},
    OrderStatus.PACKING: {OrderStatus.SHIPPED},
}

_BUYER_TRANSITIONS: dict[OrderStatus, Set[OrderStatus]] = {
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED_PENDING_CONFIRM: {OrderStatus.DELIVERED},
}


class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    store_id = Column(Integer, ForeignKey('stores.id', ondelete='CASCADE'), nullable=False, index=True)
    status = Column(SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PLACED, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='THB')
    shipping_address_id = Column(Integer, ForeignKey('addresses.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    buyer = relationship('User', foreign_keys=[buyer_id], back_populates='orders')
    store = relationship('Store', back_populates='orders')
    shipping_address = relationship('Address', back_populates='orders')
    items = relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')
    status_history = relationship('OrderStatusHistory', back_populates='order', cascade='all, delete-orphan')
    shipment = relationship('Shipment', back_populates='order', uselist=False, cascade='all, delete-orphan')


    def allowed_transitions(self, is_seller: bool = False, is_buyer: bool = False) -> Set[OrderStatus]:
        allowed: Set[OrderStatus] = set()
        if is_seller:
            allowed |= _SELLER_TRANSITIONS.get(self.status, set())
        if is_buyer:
            allowed |= _BUYER_TRANSITIONS.get(self.status, set())
        return allowed

    def can_transition_to(
        self, new_status: OrderStatus, is_seller: bool = False, is_buyer: bool = False
    ) -> bool:
        return new_status in self.allowed_transitions(is_seller=is_seller, is_buyer=is_buyer)

    def assert_transition(
        self, new_status: OrderStatus, is_seller: bool = False, is_buyer: bool = False
    ) -> None:
        if not self.can_transition_to(new_status, is_seller=is_seller, is_buyer=is_buyer):
            raise ValueError(
                f"Cannot move order from '{self.status}' to '{new_status}' with your current role."
            )

    def apply_transition(self, new_status: OrderStatus, is_seller: bool = False, is_buyer: bool = False) -> None:
        self.assert_transition(new_status, is_seller=is_seller, is_buyer=is_buyer)
        self.status = new_status

    def calculate_total(self) -> Decimal:
        total = Decimal("0")

        for item in self.items:
            price = Decimal(str(item.unit_price_snapshot))
            subtotal = price * item.quantity
            total += subtotal

        return total

    def __repr__(self):
        return f'<Order(id={self.id}, order_number={self.order_number}, status={self.status})>'
