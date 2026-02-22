"""
Store model - seller store profile and public storefront.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Store(Base):
    """
    Store model.
    Each approved seller can create one store with a unique slug.
    """
    __tablename__ = "stores"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="store")
    product_groups = relationship("ProductGroup", back_populates="store", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    inquiries = relationship("Inquiry", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store")
    
    def __repr__(self):
        return f"<Store(id={self.id}, slug={self.slug}, name={self.name})>"
