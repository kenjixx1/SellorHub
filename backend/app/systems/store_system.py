from typing import Optional, List

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.store import Store
from app.models.product import Product, ProductStatus
from app.schemas.store import StoreCreate, StoreUpdate


class StoreSystem:

    def __init__(self, db: Session):
        self.db = db

    def create_store(self, store_data: StoreCreate, owner_id: int) -> Store:
        if self.db.query(Store).filter(Store.slug == store_data.slug).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Store slug '{store_data.slug}' is already taken",
            )
        if self.db.query(Store).filter(Store.owner_id == owner_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='You already have a store. Only one store per seller is allowed.',
            )
        db_store = Store(
            owner_id=owner_id,
            slug=store_data.slug,
            name=store_data.name,
            description=store_data.description,
            logo_url=store_data.logo_url,
        )
        self.db.add(db_store)
        self.db.commit()
        self.db.refresh(db_store)
        return db_store

    def get_store_by_id(self, store_id: int) -> Optional[Store]:
        return self.db.query(Store).filter(Store.id == store_id).first()

    def get_store_by_slug(self, slug: str) -> Optional[Store]:
        return self.db.query(Store).filter(Store.slug == slug).first()

    def is_slug_taken(self, slug: str) -> bool:
        return self.db.query(Store.id).filter(Store.slug == slug).first() is not None

    def get_store_by_owner_id(self, owner_id: int) -> Optional[Store]:
        return self.db.query(Store).filter(Store.owner_id == owner_id).first()

    def get_all_stores(self, skip: int = 0, limit: int = 20) -> tuple[List[Store], int]:
        query = self.db.query(Store)
        total = query.count()
        stores = query.offset(skip).limit(limit).all()
        return stores, total

    def get_store_with_product_count(self, store_id: int) -> Optional[dict]:
        store = self.get_store_by_id(store_id)
        if not store:
            return None
        product_count = (
            self.db.query(func.count(Product.id))
            .filter(Product.store_id == store_id, Product.status == ProductStatus.ACTIVE)
            .scalar()
        )
        return {'store': store, 'product_count': product_count or 0}

    def update_store(self, store_id: int, update_data: StoreUpdate) -> Store:
        store = self.get_store_by_id(store_id)
        if not store:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Store not found')
        store.update_profile(
            name=update_data.name,
            description=update_data.description,
            logo_url=update_data.logo_url,
        )
        self.db.commit()
        self.db.refresh(store)
        return store

    def delete_store(self, store_id: int) -> bool:
        store = self.get_store_by_id(store_id)
        if not store:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Store not found')
        self.db.delete(store)
        self.db.commit()
        return True

    def search_stores(self, query: str, skip: int = 0, limit: int = 20) -> tuple[List[Store], int]:
        search_filter = Store.name.ilike(f'%{query}%') | Store.description.ilike(f'%{query}%')
        query_obj = self.db.query(Store).filter(search_filter)
        total = query_obj.count()
        stores = query_obj.offset(skip).limit(limit).all()
        return stores, total
