from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.product_group import ProductGroup
from app.models.product import Product
from app.schemas.product_group import ProductGroupCreate

class ProductGroupService:

    def __init__(self, db: Session):
        self.db = db

    def create_product_group(self, group_data: ProductGroupCreate, store_id: int) -> ProductGroup:
        existing = self.db.query(ProductGroup).filter(ProductGroup.store_id == store_id, ProductGroup.name == group_data.name).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product group '{group_data.name}' already exists in your store")
        db_group = ProductGroup(store_id=store_id, name=group_data.name)
        self.db.add(db_group)
        self.db.commit()
        self.db.refresh(db_group)
        return db_group

    def get_product_group_by_id(self, group_id: int) -> Optional[ProductGroup]:
        return self.db.query(ProductGroup).filter(ProductGroup.id == group_id).first()

    def get_store_product_groups(self, store_id: int) -> List[ProductGroup]:
        return self.db.query(ProductGroup).filter(ProductGroup.store_id == store_id).order_by(ProductGroup.name).all()

    def get_store_product_groups_with_counts(self, store_id: int) -> List[dict]:
        groups = self.get_store_product_groups(store_id)
        result = []
        for group in groups:
            product_count = self.db.query(func.count(Product.id)).filter(Product.group_id == group.id).scalar()
            result.append({'id': group.id, 'name': group.name, 'store_id': group.store_id, 'created_at': group.created_at, 'product_count': product_count or 0})
        return result

    def update_product_group(self, group_id: int, name: str, store_id: int) -> ProductGroup:
        group = self.get_product_group_by_id(group_id)
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product group not found')
        if group.store_id != store_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to update this product group")
        existing = self.db.query(ProductGroup).filter(ProductGroup.store_id == store_id, ProductGroup.name == name, ProductGroup.id != group_id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product group '{name}' already exists in your store")
        group.name = name
        self.db.commit()
        self.db.refresh(group)
        return group

    def delete_product_group(self, group_id: int, store_id: int) -> bool:
        group = self.get_product_group_by_id(group_id)
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product group not found')
        if group.store_id != store_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to delete this product group")
        self.db.delete(group)
        self.db.commit()
        return True