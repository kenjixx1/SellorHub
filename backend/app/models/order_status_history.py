"""
OrderStatusHistory model - tracking log for order status changes (Post-MVP).
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.order import OrderStatus


class OrderStatusHistory(Base):
    """
    Order status history model.
    Tracks all status changes for an order with timeline.
    """
    __tablename__ = "order_status_history"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(SQLEnum(OrderStatus), nullable=False)
    note = Column(Text, nullable=True)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="status_history")
    changed_by = relationship("User", foreign_keys=[changed_by_user_id], back_populates="status_changes")
    
    def __repr__(self):
        return f"<OrderStatusHistory(id={self.id}, order_id={self.order_id}, status={self.status})>"
