"""
Address model - saved user shipping addresses (Post-MVP).
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Address(Base):
    """
    Address model.
    Stores shipping addresses for buyers (used in Phase 2).
    """
    __tablename__ = "addresses"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    label = Column(String(50), nullable=True)
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    
    address_line1 = Column(String(200), nullable=False)
    address_line2 = Column(String(200), nullable=True)
    
    city = Column(String(100), nullable=False)
    province = Column(String(100), nullable=False)
    postal_code = Column(String(10), nullable=False)
    country = Column(String(50), nullable=False, default="Thailand")
    
    is_default = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="addresses")
    orders = relationship("Order", back_populates="shipping_address")
    
    def __repr__(self):
        return f"<Address(id={self.id}, user_id={self.user_id}, label={self.label})>"
