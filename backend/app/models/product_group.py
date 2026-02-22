"""
ProductGroup model - categories inside a store.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ProductGroup(Base):
    """
    Product group (category) model.
    Sellers can organize products into custom categories within their store.
    """
    __tablename__ = "product_groups"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    store = relationship("Store", back_populates="product_groups")
    products = relationship("Product", back_populates="group")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint("store_id", "name", name="uq_store_product_group_name"),
    )
    
    def __repr__(self):
        return f"<ProductGroup(id={self.id}, store_id={self.store_id}, name={self.name})>"
