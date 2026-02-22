"""
User model - accounts for buyers, sellers, and admins.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    BUYER = "buyer"
    SELLER = "seller"
    ADMIN = "admin"


class User(Base):
    """
    User account model.
    Represents buyers, sellers, and administrators.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.BUYER)
    phone_number = Column(String, unique=True, nullable=True)
    selling_approve = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    store = relationship("Store", back_populates="owner", uselist=False, cascade="all, delete-orphan")
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", foreign_keys="Order.buyer_id", back_populates="buyer")
    status_changes = relationship("OrderStatusHistory", foreign_keys="OrderStatusHistory.changed_by_user_id", back_populates="changed_by")
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
