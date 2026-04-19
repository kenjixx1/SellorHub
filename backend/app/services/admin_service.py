from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.store import Store
from app.models.product import Product, ProductStatus
from app.models.inquiry import Inquiry

class AdminService:

    def __init__(self, db: Session):
        self.db = db

    def get_all_users(self, role: Optional[UserRole]=None, skip: int=0, limit: int=50) -> tuple[List[User], int]:
        query = self.db.query(User)
        if role is not None:
            query = query.filter(User.role == role)
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return (users, total)

    def get_pending_sellers(self, skip: int=0, limit: int=50) -> tuple[List[User], int]:
        query = self.db.query(User).filter(User.role == UserRole.SELLER, User.selling_approve == False)
        total = query.count()
        sellers = query.order_by(User.created_at.asc()).offset(skip).limit(limit).all()
        return (sellers, total)

    def approve_seller(self, user_id: int, approve: bool=True) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        if user.role != UserRole.SELLER:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='User is not a seller')
        user.selling_approve = approve
        self.db.commit()
        self.db.refresh(user)
        return user

    def search_users(self, search_query: str, skip: int=0, limit: int=50) -> tuple[List[User], int]:
        from sqlalchemy import or_
        search_filter = or_(User.username.ilike(f'%{search_query}%'), User.email.ilike(f'%{search_query}%'))
        query = self.db.query(User).filter(search_filter)
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        return (users, total)

    def ban_user(self, user_id: int) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        if user.role == UserRole.SELLER:
            user.selling_approve = False
            self.db.commit()
            self.db.refresh(user)
        return user

    def get_all_stores(self, skip: int=0, limit: int=50) -> tuple[List[Store], int]:
        query = self.db.query(Store)
        total = query.count()
        stores = query.order_by(Store.created_at.desc()).offset(skip).limit(limit).all()
        return (stores, total)

    def hide_store(self, store_id: int, hide: bool=True) -> Store:
        store = self.db.query(Store).filter(Store.id == store_id).first()
        if not store:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Store not found')
        return store

    def get_all_products(self, skip: int=0, limit: int=50, status: Optional[ProductStatus]=None) -> tuple[List[Product], int]:
        query = self.db.query(Product)
        if status is not None:
            query = query.filter(Product.status == status)
        total = query.count()
        products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
        return (products, total)

    def hide_product(self, product_id: int) -> Product:
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
        product.status = ProductStatus.HIDDEN
        self.db.commit()
        self.db.refresh(product)
        return product

    def unhide_product(self, product_id: int) -> Product:
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
        product.status = ProductStatus.ACTIVE
        self.db.commit()
        self.db.refresh(product)
        return product

    def get_platform_statistics(self) -> dict:
        total_users = self.db.query(func.count(User.id)).scalar()
        total_buyers = self.db.query(func.count(User.id)).filter(User.role == UserRole.BUYER).scalar()
        total_sellers = self.db.query(func.count(User.id)).filter(User.role == UserRole.SELLER).scalar()
        pending_sellers = self.db.query(func.count(User.id)).filter(User.role == UserRole.SELLER, User.selling_approve == False).scalar()
        total_stores = self.db.query(func.count(Store.id)).scalar()
        total_products = self.db.query(func.count(Product.id)).scalar()
        active_products = self.db.query(func.count(Product.id)).filter(Product.status == ProductStatus.ACTIVE).scalar()
        total_inquiries = self.db.query(func.count(Inquiry.id)).scalar()
        from datetime import datetime, timedelta
        today = datetime.utcnow().date()
        inquiries_today = self.db.query(func.count(Inquiry.id)).filter(func.date(Inquiry.created_at) == today).scalar()
        return {'users': {'total': total_users or 0, 'buyers': total_buyers or 0, 'sellers': total_sellers or 0, 'pending_seller_approvals': pending_sellers or 0}, 'stores': {'total': total_stores or 0}, 'products': {'total': total_products or 0, 'active': active_products or 0}, 'inquiries': {'total': total_inquiries or 0, 'today': inquiries_today or 0}}