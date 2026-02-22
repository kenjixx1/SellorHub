"""
Inquiry service for buyer-seller communication.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.inquiry import Inquiry, InquiryStatus
from app.models.product import Product
from app.schemas.inquiry import InquiryCreate, InquiryUpdate


class InquiryService:
    """Service for inquiry management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_inquiry(self, inquiry_data: InquiryCreate) -> Inquiry:
        """
        Create a new inquiry (buyer contacts seller about a product).
        
        Args:
            inquiry_data: Inquiry creation data
            
        Returns:
            Created Inquiry object
            
        Raises:
            HTTPException: If product not found
        """
        # Verify product exists and get store_id
        product = self.db.query(Product).filter(Product.id == inquiry_data.product_id).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Create inquiry
        db_inquiry = Inquiry(
            store_id=product.store_id,
            product_id=inquiry_data.product_id,
            buyer_name=inquiry_data.buyer_name,
            buyer_email=inquiry_data.buyer_email,
            message=inquiry_data.message,
            status=InquiryStatus.NEW
        )
        
        self.db.add(db_inquiry)
        self.db.commit()
        self.db.refresh(db_inquiry)
        
        # TODO: Send email notification to seller
        
        return db_inquiry
    
    def get_inquiry_by_id(self, inquiry_id: int) -> Optional[Inquiry]:
        """
        Get inquiry by ID.
        
        Args:
            inquiry_id: Inquiry ID
            
        Returns:
            Inquiry object if found, None otherwise
        """
        return self.db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    
    def get_store_inquiries(
        self,
        store_id: int,
        status: Optional[InquiryStatus] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Inquiry], int]:
        """
        Get inquiries for a store with filters.
        
        Args:
            store_id: Store ID
            status: Filter by status (optional)
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of inquiries, total count)
        """
        query = self.db.query(Inquiry).filter(Inquiry.store_id == store_id)
        
        if status is not None:
            query = query.filter(Inquiry.status == status)
        
        total = query.count()
        inquiries = query.order_by(Inquiry.created_at.desc()).offset(skip).limit(limit).all()
        
        return inquiries, total
    
    def get_product_inquiries(
        self,
        product_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Inquiry], int]:
        """
        Get inquiries for a specific product.
        
        Args:
            product_id: Product ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            Tuple of (list of inquiries, total count)
        """
        query = self.db.query(Inquiry).filter(Inquiry.product_id == product_id)
        
        total = query.count()
        inquiries = query.order_by(Inquiry.created_at.desc()).offset(skip).limit(limit).all()
        
        return inquiries, total
    
    def update_inquiry_status(
        self,
        inquiry_id: int,
        update_data: InquiryUpdate,
        store_id: int
    ) -> Inquiry:
        """
        Update inquiry status (seller marks as replied/closed).
        
        Args:
            inquiry_id: Inquiry ID
            update_data: Updated inquiry data
            store_id: Store ID (for verification)
            
        Returns:
            Updated Inquiry object
            
        Raises:
            HTTPException: If inquiry not found or unauthorized
        """
        inquiry = self.get_inquiry_by_id(inquiry_id)
        
        if not inquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inquiry not found"
            )
        
        # Verify inquiry belongs to store
        if inquiry.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this inquiry"
            )
        
        inquiry.status = update_data.status
        
        self.db.commit()
        self.db.refresh(inquiry)
        
        return inquiry
    
    def delete_inquiry(self, inquiry_id: int, store_id: int) -> bool:
        """
        Delete an inquiry (admin or store owner).
        
        Args:
            inquiry_id: Inquiry ID
            store_id: Store ID (for verification)
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If inquiry not found or unauthorized
        """
        inquiry = self.get_inquiry_by_id(inquiry_id)
        
        if not inquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inquiry not found"
            )
        
        # Verify inquiry belongs to store
        if inquiry.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this inquiry"
            )
        
        self.db.delete(inquiry)
        self.db.commit()
        
        return True
    
    def get_inquiry_statistics(self, store_id: int) -> dict:
        """
        Get inquiry statistics for a store.
        
        Args:
            store_id: Store ID
            
        Returns:
            Dictionary with inquiry counts by status
        """
        from sqlalchemy import func
        
        stats = self.db.query(
            Inquiry.status,
            func.count(Inquiry.id).label('count')
        ).filter(
            Inquiry.store_id == store_id
        ).group_by(Inquiry.status).all()
        
        result = {
            "new": 0,
            "replied": 0,
            "closed": 0,
            "total": 0
        }
        
        for status, count in stats:
            result[status.value] = count
            result["total"] += count
        
        return result
