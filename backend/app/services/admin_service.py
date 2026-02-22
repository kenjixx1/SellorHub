"""
Admin service for platform administration operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.models.store import Store
from app.models.product import Product, ProductStatus
from app.models.inquiry import Inquiry


class AdminService:
    """Service for admin operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # User Management
    
    def get_all_users(
        self,
        role: Optional[UserRole] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[User], int]:
        """
        Get all users with filters.
        
        Args:
            role: Filter by user role (optional)
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of users, total count)
        """
        query = self.db.query(User)
        
        if role is not None:
            query = query.filter(User.role == role)
        
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        
        return users, total
    
    def get_pending_sellers(self, skip: int = 0, limit: int = 50) -> tuple[List[User], int]:
        """
        Get sellers pending approval.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of pending sellers, total count)
        """
        query = self.db.query(User).filter(
            User.role == UserRole.SELLER,
            User.selling_approve == False
        )
        
        total = query.count()
        sellers = query.order_by(User.created_at.asc()).offset(skip).limit(limit).all()
        
        return sellers, total
    
    def approve_seller(self, user_id: int, approve: bool = True) -> User:
        """
        Approve or reject a seller application.
        
        Args:
            user_id: User ID to approve/reject
            approve: True to approve, False to reject
            
        Returns:
            Updated User object
            
        Raises:
            HTTPException: If user not found or not a seller
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.SELLER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a seller"
            )
        
        user.selling_approve = approve
        
        self.db.commit()
        self.db.refresh(user)
        
        # TODO: Send email notification to seller
        
        return user
    
    def search_users(
        self,
        search_query: str,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[User], int]:
        """
        Search users by username or email.
        
        Args:
            search_query: Search query string
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of matching users, total count)
        """
        from sqlalchemy import or_
        
        search_filter = or_(
            User.username.ilike(f"%{search_query}%"),
            User.email.ilike(f"%{search_query}%")
        )
        
        query = self.db.query(User).filter(search_filter)
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        
        return users, total
    
    def ban_user(self, user_id: int) -> User:
        """
        Ban a user (set to inactive or delete).
        Note: Implementation depends on requirements.
        For now, this is a placeholder.
        
        Args:
            user_id: User ID to ban
            
        Returns:
            Updated User object
            
        Raises:
            HTTPException: If user not found
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # TODO: Implement ban logic (e.g., add is_banned field to User model)
        # For now, we can set selling_approve to False for sellers
        if user.role == UserRole.SELLER:
            user.selling_approve = False
            self.db.commit()
            self.db.refresh(user)
        
        return user
    
    # Store Management
    
    def get_all_stores(self, skip: int = 0, limit: int = 50) -> tuple[List[Store], int]:
        """
        Get all stores (admin view).
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of stores, total count)
        """
        query = self.db.query(Store)
        total = query.count()
        stores = query.order_by(Store.created_at.desc()).offset(skip).limit(limit).all()
        
        return stores, total
    
    def hide_store(self, store_id: int, hide: bool = True) -> Store:
        """
        Hide or unhide a store (moderation).
        Note: Requires adding is_hidden field to Store model.
        
        Args:
            store_id: Store ID
            hide: True to hide, False to unhide
            
        Returns:
            Updated Store object
            
        Raises:
            HTTPException: If store not found
        """
        store = self.db.query(Store).filter(Store.id == store_id).first()
        
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        # TODO: Add is_hidden field to Store model if needed
        # store.is_hidden = hide
        # self.db.commit()
        # self.db.refresh(store)
        
        return store
    
    # Product Management
    
    def get_all_products(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[ProductStatus] = None
    ) -> tuple[List[Product], int]:
        """
        Get all products (admin view).
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status (optional)
            
        Returns:
            Tuple of (list of products, total count)
        """
        query = self.db.query(Product)
        
        if status is not None:
            query = query.filter(Product.status == status)
        
        total = query.count()
        products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
        
        return products, total
    
    def hide_product(self, product_id: int) -> Product:
        """
        Hide a product (moderation).
        
        Args:
            product_id: Product ID
            
        Returns:
            Updated Product object
            
        Raises:
            HTTPException: If product not found
        """
        product = self.db.query(Product).filter(Product.id == product_id).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        product.status = ProductStatus.HIDDEN
        
        self.db.commit()
        self.db.refresh(product)
        
        return product
    
    def unhide_product(self, product_id: int) -> Product:
        """
        Unhide a product (restore to active).
        
        Args:
            product_id: Product ID
            
        Returns:
            Updated Product object
            
        Raises:
            HTTPException: If product not found
        """
        product = self.db.query(Product).filter(Product.id == product_id).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        product.status = ProductStatus.ACTIVE
        
        self.db.commit()
        self.db.refresh(product)
        
        return product
    
    # Platform Statistics
    
    def get_platform_statistics(self) -> dict:
        """
        Get platform-wide statistics.
        
        Returns:
            Dictionary with various statistics
        """
        # User statistics
        total_users = self.db.query(func.count(User.id)).scalar()
        total_buyers = self.db.query(func.count(User.id)).filter(User.role == UserRole.BUYER).scalar()
        total_sellers = self.db.query(func.count(User.id)).filter(User.role == UserRole.SELLER).scalar()
        pending_sellers = self.db.query(func.count(User.id)).filter(
            User.role == UserRole.SELLER,
            User.selling_approve == False
        ).scalar()
        
        # Store statistics
        total_stores = self.db.query(func.count(Store.id)).scalar()
        
        # Product statistics
        total_products = self.db.query(func.count(Product.id)).scalar()
        active_products = self.db.query(func.count(Product.id)).filter(
            Product.status == ProductStatus.ACTIVE
        ).scalar()
        
        # Inquiry statistics
        total_inquiries = self.db.query(func.count(Inquiry.id)).scalar()
        
        # Today's inquiries
        from datetime import datetime, timedelta
        today = datetime.utcnow().date()
        inquiries_today = self.db.query(func.count(Inquiry.id)).filter(
            func.date(Inquiry.created_at) == today
        ).scalar()
        
        return {
            "users": {
                "total": total_users or 0,
                "buyers": total_buyers or 0,
                "sellers": total_sellers or 0,
                "pending_seller_approvals": pending_sellers or 0
            },
            "stores": {
                "total": total_stores or 0
            },
            "products": {
                "total": total_products or 0,
                "active": active_products or 0
            },
            "inquiries": {
                "total": total_inquiries or 0,
                "today": inquiries_today or 0
            }
        }
