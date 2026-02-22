"""
Product model - product listings.
"""
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class ProductStatus(str, enum.Enum):
    """Product status enumeration."""
    ACTIVE = "active"
    SOLD = "sold"
    HIDDEN = "hidden"


class Product(Base):
    """
    Product model.
    Represents items listed by sellers in their stores.
    """
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("product_groups.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    price = Column(Numeric(10, 2), nullable=False, index=True)
    stock = Column(Integer, nullable=True)
    status = Column(SQLEnum(ProductStatus), nullable=False, default=ProductStatus.ACTIVE, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    store = relationship("Store", back_populates="products")
    group = relationship("ProductGroup", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.position")
    inquiries = relationship("Inquiry", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    
    def __repr__(self):
        return f"<Product(id={self.id}, title={self.title}, price={self.price}, status={self.status})>"
