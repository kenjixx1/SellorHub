from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ProductImage(Base):
    __tablename__ = 'product_images'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    position = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    product = relationship('Product', back_populates='images')
    __table_args__ = (UniqueConstraint('product_id', 'position', name='uq_product_image_position'),)

    def __repr__(self):
        return f'<ProductImage(id={self.id}, product_id={self.product_id}, position={self.position})>'