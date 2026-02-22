"""
Store service for store management operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.store import Store
from app.models.product import Product, ProductStatus
from app.schemas.store import StoreCreate, StoreUpdate


class StoreService:
    """Service for store management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_store(self, store_data: StoreCreate, owner_id: int) -> Store:
        """
        Create a new store for a seller.
        
        Args:
            store_data: Store creation data
            owner_id: Owner user ID
            
        Returns:
            Created Store object
            
        Raises:
            HTTPException: If slug exists or seller already has a store
        """
        # Check if slug already exists
        existing_slug = self.db.query(Store).filter(Store.slug == store_data.slug).first()
        if existing_slug:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Store slug '{store_data.slug}' is already taken"
            )
        
        # Check if seller already has a store
        existing_store = self.db.query(Store).filter(Store.owner_id == owner_id).first()
        if existing_store:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a store. Only one store per seller is allowed."
            )
        
        # Create store
        db_store = Store(
            owner_id=owner_id,
            slug=store_data.slug,
            name=store_data.name,
            description=store_data.description,
            logo_url=store_data.logo_url
        )
        
        self.db.add(db_store)
        self.db.commit()
        self.db.refresh(db_store)
        
        return db_store
    
    def get_store_by_id(self, store_id: int) -> Optional[Store]:
        """
        Get store by ID.
        
        Args:
            store_id: Store ID
            
        Returns:
            Store object if found, None otherwise
        """
        return self.db.query(Store).filter(Store.id == store_id).first()
    
    def get_store_by_slug(self, slug: str) -> Optional[Store]:
        """
        Get store by slug.
        
        Args:
            slug: Store slug
            
        Returns:
            Store object if found, None otherwise
        """
        return self.db.query(Store).filter(Store.slug == slug).first()
    
    def get_store_by_owner_id(self, owner_id: int) -> Optional[Store]:
        """
        Get store by owner ID.
        
        Args:
            owner_id: Owner user ID
            
        Returns:
            Store object if found, None otherwise
        """
        return self.db.query(Store).filter(Store.owner_id == owner_id).first()
    
    def get_all_stores(self, skip: int = 0, limit: int = 20) -> tuple[List[Store], int]:
        """
        Get all stores with pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of stores, total count)
        """
        query = self.db.query(Store)
        total = query.count()
        stores = query.offset(skip).limit(limit).all()
        
        return stores, total
    
    def get_store_with_product_count(self, store_id: int) -> Optional[dict]:
        """
        Get store with active product count.
        
        Args:
            store_id: Store ID
            
        Returns:
            Dictionary with store info and product count
        """
        store = self.get_store_by_id(store_id)
        
        if not store:
            return None
        
        product_count = self.db.query(func.count(Product.id)).filter(
            Product.store_id == store_id,
            Product.status == ProductStatus.ACTIVE
        ).scalar()
        
        return {
            "store": store,
            "product_count": product_count or 0
        }
    
    def update_store(self, store_id: int, update_data: StoreUpdate) -> Store:
        """
        Update store information.
        
        Args:
            store_id: Store ID to update
            update_data: Updated store data
            
        Returns:
            Updated Store object
            
        Raises:
            HTTPException: If store not found
        """
        store = self.get_store_by_id(store_id)
        
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        # Update fields if provided (slug cannot be changed)
        if update_data.name is not None:
            store.name = update_data.name
        
        if update_data.description is not None:
            store.description = update_data.description
        
        if update_data.logo_url is not None:
            store.logo_url = update_data.logo_url
        
        self.db.commit()
        self.db.refresh(store)
        
        return store
    
    def delete_store(self, store_id: int) -> bool:
        """
        Delete a store.
        
        Args:
            store_id: Store ID to delete
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If store not found
        """
        store = self.get_store_by_id(store_id)
        
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found"
            )
        
        self.db.delete(store)
        self.db.commit()
        
        return True
    
    def search_stores(self, query: str, skip: int = 0, limit: int = 20) -> tuple[List[Store], int]:
        """
        Search stores by name or description.
        
        Args:
            query: Search query string
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of matching stores, total count)
        """
        search_filter = Store.name.ilike(f"%{query}%") | Store.description.ilike(f"%{query}%")
        
        query_obj = self.db.query(Store).filter(search_filter)
        total = query_obj.count()
        stores = query_obj.offset(skip).limit(limit).all()
        
        return stores, total
