"""
Inquiry model - MVP contact/inquiry system.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class InquiryStatus(str, enum.Enum):
    """Inquiry status enumeration."""
    NEW = "new"
    REPLIED = "replied"
    CLOSED = "closed"


class Inquiry(Base):
    """
    Inquiry model.
    Allows buyers to contact sellers about products.
    """
    __tablename__ = "inquiries"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    buyer_name = Column(String(100), nullable=False)
    buyer_email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    status = Column(SQLEnum(InquiryStatus), nullable=False, default=InquiryStatus.NEW, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    store = relationship("Store", back_populates="inquiries")
    product = relationship("Product", back_populates="inquiries")
    
    def __repr__(self):
        return f"<Inquiry(id={self.id}, product_id={self.product_id}, status={self.status})>"
