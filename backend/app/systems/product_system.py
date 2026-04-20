"""
ProductSystem - application-layer orchestration for product management.
Delegates domain rules to the Product entity.
"""
from typing import Optional, List

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.product import Product, ProductStatus
from app.models.product_image import ProductImage
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.product_image import ProductImageCreate


class ProductSystem:
    """Orchestrates product CRUD, image management, and search workflows."""

    def __init__(self, db: Session):
        self.db = db

    def create_product(self, product_data: ProductCreate, store_id: int) -> Product:
        db_product = Product(
            store_id=store_id,
            title=product_data.title,
            description=product_data.description,
            price=product_data.price,
            stock=product_data.stock,
            status=product_data.status,
            group_id=product_data.group_id,
        )
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        return db_product

    def get_product_by_id(self, product_id: int, include_hidden: bool = False) -> Optional[Product]:
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
        include_hidden: bool = False,
    ) -> tuple[List[Product], int]:
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
        sort_by: str = 'newest',
    ) -> tuple[List[Product], int]:
        query = self.db.query(Product)
        if status:
            query = query.filter(Product.status == status)
        if search_query:
            query = query.filter(
                or_(
                    Product.title.ilike(f'%{search_query}%'),
                    Product.description.ilike(f'%{search_query}%'),
                )
            )
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        if group_ids:
            query = query.filter(Product.group_id.in_(group_ids))
        if store_ids:
            query = query.filter(Product.store_id.in_(store_ids))
        if sort_by == 'price_asc':
            query = query.order_by(Product.price.asc())
        elif sort_by == 'price_desc':
            query = query.order_by(Product.price.desc())
        elif sort_by == 'alphabetical':
            query = query.order_by(Product.title.asc())
        else:
            query = query.order_by(Product.created_at.desc())
        total = query.count()
        products = query.offset(skip).limit(limit).all()
        return products, total

    def update_product(self, product_id: int, update_data: ProductUpdate, store_id: int) -> Product:
        product = self.get_product_by_id(product_id, include_hidden=True)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
        if product.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this product",
            )
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
        product = self.get_product_by_id(product_id, include_hidden=True)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
        if product.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this product",
            )
        self.db.delete(product)
        self.db.commit()
        return True

    def add_product_image(self, image_data: ProductImageCreate) -> ProductImage:
        existing = self.db.query(ProductImage).filter(
            ProductImage.product_id == image_data.product_id,
            ProductImage.position == image_data.position,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Image position {image_data.position} is already taken',
            )
        image_count = self.db.query(ProductImage).filter(
            ProductImage.product_id == image_data.product_id
        ).count()
        if image_count >= 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Maximum of 5 images per product',
            )
        db_image = ProductImage(
            product_id=image_data.product_id,
            image_url=image_data.image_url,
            position=image_data.position,
        )
        self.db.add(db_image)
        self.db.commit()
        self.db.refresh(db_image)
        return db_image

    def delete_product_image(self, image_id: int, store_id: int) -> bool:
        image = self.db.query(ProductImage).filter(ProductImage.id == image_id).first()
        if not image:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product image not found')
        product = self.get_product_by_id(image.product_id, include_hidden=True)
        if not product or product.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this image",
            )
        self.db.delete(image)
        self.db.commit()
        return True

    def reorder_product_images(
        self, product_id: int, image_positions: dict[int, int], store_id: int
    ) -> List[ProductImage]:
        product = self.get_product_by_id(product_id, include_hidden=True)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
        if product.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to modify this product",
            )
        for image_id, new_position in image_positions.items():
            image = self.db.query(ProductImage).filter(
                ProductImage.id == image_id,
                ProductImage.product_id == product_id,
            ).first()
            if image:
                image.position = new_position
        self.db.commit()
        return (
            self.db.query(ProductImage)
            .filter(ProductImage.product_id == product_id)
            .order_by(ProductImage.position)
            .all()
        )
