"""
Inquiry model - buyer questions about products.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class InquiryStatus(str, enum.Enum):
    """Inquiry lifecycle status."""
    NEW = 'new'
    REPLIED = 'replied'
    CLOSED = 'closed'


class Inquiry(Base):
    """
    Inquiry entity.
    Owns lifecycle-status transition helpers.
    """
    __tablename__ = 'inquiries'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey('stores.id', ondelete='CASCADE'), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    buyer_name = Column(String(100), nullable=False)
    buyer_email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    status = Column(SQLEnum(InquiryStatus), nullable=False, default=InquiryStatus.NEW, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    store = relationship('Store', back_populates='inquiries')
    product = relationship('Product', back_populates='inquiries')

    # ── Domain behaviour ──────────────────────────────────────────────────────

    def belongs_to_store(self, store_id: int) -> bool:
        """Return True when this inquiry is addressed to *store_id*."""
        return self.store_id == store_id

    def mark_replied(self) -> None:
        """Transition the inquiry to REPLIED status."""
        self.status = InquiryStatus.REPLIED

    def close(self) -> None:
        """Transition the inquiry to CLOSED status."""
        self.status = InquiryStatus.CLOSED

    def update_status(self, new_status: InquiryStatus) -> None:
        """Apply a status update."""
        self.status = new_status

    def __repr__(self):
        return f'<Inquiry(id={self.id}, product_id={self.product_id}, status={self.status})>'
