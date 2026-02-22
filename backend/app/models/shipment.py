"""
Shipment model - stores tracking number and carrier (Post-MVP).
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Shipment(Base):
    """
    Shipment model.
    Stores tracking information for orders (Phase 2 feature).
    """
    __tablename__ = "shipments"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    carrier = Column(String(100), nullable=False)
    tracking_number = Column(String(100), nullable=False)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="shipment")
    
    def __repr__(self):
        return f"<Shipment(id={self.id}, order_id={self.order_id}, carrier={self.carrier})>"
