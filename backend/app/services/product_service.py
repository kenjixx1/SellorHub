"""
Product service for product management operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException, status

from app.models.product import Product, ProductStatus
from app.models.product_image import ProductImage
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.product_image import ProductImageCreate


class ProductService:
    """Service for product management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_product(self, product_data: ProductCreate, store_id: int) -> Product:
        """
        Create a new product.
        
        Args:
            product_data: Product creation data
            store_id: Store ID
            
        Returns:
            Created Product object
        """
        db_product = Product(
            store_id=store_id,
            title=product_data.title,
            description=product_data.description,
            price=product_data.price,
            stock=product_data.stock,
            status=product_data.status,
            group_id=product_data.group_id
        )
        
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        
        return db_product
    
    def get_product_by_id(self, product_id: int, include_hidden: bool = False) -> Optional[Product]:
        """
        Get product by ID.
        
        Args:
            product_id: Product ID
            include_hidden: Whether to include hidden products (for owners/admins)
            
        Returns:
            Product object if found, None otherwise
        """
        query = self.db.query(Product).filter(Product.id == product_id)
        
        if not include_hidden:
            query = query.filter(Product.status != ProductStatus.HIDDEN)
        
        return query.first()
    
    def get_store_products(
        self, 
        store_id: int, 
        skip: int = 0, 
        limit: int = 20,
        group_id: Optional[int] = None,
        status: Optional[ProductStatus] = None,
        include_hidden: bool = False
    ) -> tuple[List[Product], int]:
        """
        Get products for a store with filters.
        
        Args:
            store_id: Store ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            group_id: Filter by product group (optional)
            status: Filter by status (optional)
            include_hidden: Whether to include hidden products
            
        Returns:
            Tuple of (list of products, total count)
        """
        query = self.db.query(Product).filter(Product.store_id == store_id)
        
        if not include_hidden:
            query = query.filter(Product.status != ProductStatus.HIDDEN)
        
        if group_id is not None:
            query = query.filter(Product.group_id == group_id)
        
        if status is not None:
            query = query.filter(Product.status == status)
        
        total = query.count()
        products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
        
        return products, total
    
    def search_products(
        self,
        search_query: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        group_ids: Optional[List[int]] = None,
        store_ids: Optional[List[int]] = None,
        status: Optional[ProductStatus] = ProductStatus.ACTIVE,
        skip: int = 0,
        limit: int = 20,
        sort_by: str = "newest"
    ) -> tuple[List[Product], int]:
        """
        Search and filter products.
        
        Args:
            search_query: Search in title and description
            min_price: Minimum price filter
            max_price: Maximum price filter
            group_ids: Filter by product groups
            store_ids: Filter by stores
            status: Filter by status
            skip: Number of records to skip
            limit: Maximum number of records to return
            sort_by: Sort order (newest, price_asc, price_desc, alphabetical)
            
        Returns:
            Tuple of (list of products, total count)
        """
        query = self.db.query(Product)
        
        # Apply filters
        if status:
            query = query.filter(Product.status == status)
        
        if search_query:
            search_filter = or_(
                Product.title.ilike(f"%{search_query}%"),
                Product.description.ilike(f"%{search_query}%")
            )
            query = query.filter(search_filter)
        
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        if group_ids:
            query = query.filter(Product.group_id.in_(group_ids))
        
        if store_ids:
            query = query.filter(Product.store_id.in_(store_ids))
        
        # Apply sorting
        if sort_by == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort_by == "alphabetical":
            query = query.order_by(Product.title.asc())
        else:  # newest (default)
            query = query.order_by(Product.created_at.desc())
        
        total = query.count()
        products = query.offset(skip).limit(limit).all()
        
        return products, total
    
    def update_product(self, product_id: int, update_data: ProductUpdate, store_id: int) -> Product:
        """
        Update a product.
        
        Args:
            product_id: Product ID
            update_data: Updated product data
            store_id: Store ID (for verification)
            
        Returns:
            Updated Product object
            
        Raises:
            HTTPException: If product not found or unauthorized
        """
        product = self.get_product_by_id(product_id, include_hidden=True)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Verify product belongs to store
        if product.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this product"
            )
        
        # Update fields if provided
        if update_data.title is not None:
            product.title = update_data.title
        
        if update_data.description is not None:
            product.description = update_data.description
        
        if update_data.price is not None:
            product.price = update_data.price
        
        if update_data.stock is not None:
            product.stock = update_data.stock
        
        if update_data.status is not None:
            product.status = update_data.status
        
        if update_data.group_id is not None:
            product.group_id = update_data.group_id
        
        self.db.commit()
        self.db.refresh(product)
        
        return product
    
    def delete_product(self, product_id: int, store_id: int) -> bool:
        """
        Delete a product.
        
        Args:
            product_id: Product ID
            store_id: Store ID (for verification)
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If product not found or unauthorized
        """
        product = self.get_product_by_id(product_id, include_hidden=True)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Verify product belongs to store
        if product.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this product"
            )
        
        self.db.delete(product)
        self.db.commit()
        
        return True
    
    def add_product_image(self, image_data: ProductImageCreate) -> ProductImage:
        """
        Add an image to a product.
        
        Args:
            image_data: Product image data
            
        Returns:
            Created ProductImage object
            
        Raises:
            HTTPException: If position conflict or max images reached
        """
        # Check if position is already taken
        existing = self.db.query(ProductImage).filter(
            ProductImage.product_id == image_data.product_id,
            ProductImage.position == image_data.position
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image position {image_data.position} is already taken"
            )
        
        # Check image count (max 5)
        image_count = self.db.query(ProductImage).filter(
            ProductImage.product_id == image_data.product_id
        ).count()
        
        if image_count >= 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum of 5 images per product"
            )
        
        db_image = ProductImage(
            product_id=image_data.product_id,
            image_url=image_data.image_url,
            position=image_data.position
        )
        
        self.db.add(db_image)
        self.db.commit()
        self.db.refresh(db_image)
        
        return db_image
    
    def delete_product_image(self, image_id: int, store_id: int) -> bool:
        """
        Delete a product image.
        
        Args:
            image_id: Product image ID
            store_id: Store ID (for verification)
            
        Returns:
            True if deleted successfully
            
        Raises:
            HTTPException: If image not found or unauthorized
        """
        image = self.db.query(ProductImage).filter(ProductImage.id == image_id).first()
        
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product image not found"
            )
        
        # Verify image's product belongs to store
        product = self.get_product_by_id(image.product_id, include_hidden=True)
        if not product or product.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this image"
            )
        
        self.db.delete(image)
        self.db.commit()
        
        return True
    
    def reorder_product_images(self, product_id: int, image_positions: dict[int, int], store_id: int) -> List[ProductImage]:
        """
        Reorder product images.
        
        Args:
            product_id: Product ID
            image_positions: Dictionary mapping image_id to new position
            store_id: Store ID (for verification)
            
        Returns:
            Updated list of ProductImage objects
            
        Raises:
            HTTPException: If product not found or unauthorized
        """
        product = self.get_product_by_id(product_id, include_hidden=True)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        if product.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to modify this product"
            )
        
        # Update positions
        for image_id, new_position in image_positions.items():
            image = self.db.query(ProductImage).filter(
                ProductImage.id == image_id,
                ProductImage.product_id == product_id
            ).first()
            
            if image:
                image.position = new_position
        
        self.db.commit()
        
        # Return updated images
        return self.db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).order_by(ProductImage.position).all()
