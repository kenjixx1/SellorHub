"""
StoreRating model - buyer reviews for stores.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class StoreRating(Base):
    """
    Store rating / review model.
    One rating per buyer per store. Requires a completed (delivered) order.
    """
    __tablename__ = "store_ratings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)

    score = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    store = relationship("Store", backref="ratings")
    buyer = relationship("User", backref="store_ratings")
    order = relationship("Order")

    __table_args__ = (
        UniqueConstraint("store_id", "buyer_id", name="uq_store_rating_buyer"),
        CheckConstraint("score >= 1 AND score <= 5", name="ck_score_range"),
    )

    def __repr__(self):
        return f"<StoreRating(id={self.id}, store_id={self.store_id}, buyer_id={self.buyer_id}, score={self.score})>"
