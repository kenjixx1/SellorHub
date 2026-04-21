"""
AdminSystem - application-layer orchestration for admin-facing workflows.
Delegates domain-specific CRUD and moderation to stronger domain systems.
"""
from datetime import datetime
from typing import Optional, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.inquiry import Inquiry
from app.models.product import Product, ProductStatus
from app.models.store import Store
from app.models.user import User, UserRole
from app.systems.product_system import ProductSystem
from app.systems.store_system import StoreSystem
from app.systems.user_system import UserSystem


class AdminSystem:
    """Coordinates admin workflows while delegating domain operations to other systems."""

    def __init__(self, db: Session):
        self.db = db

    def _user_system(self) -> UserSystem:
        return UserSystem(self.db)

    def _store_system(self) -> StoreSystem:
        return StoreSystem(self.db)

    def _product_system(self) -> ProductSystem:
        return ProductSystem(self.db)

    def get_all_users(
        self, role: Optional[UserRole] = None, skip: int = 0, limit: int = 50
    ) -> tuple[List[User], int]:
        return self._user_system().get_all_users(role=role, skip=skip, limit=limit)

    def get_pending_sellers(self, skip: int = 0, limit: int = 50) -> tuple[List[User], int]:
        return self._user_system().get_pending_sellers(skip=skip, limit=limit)

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self._user_system().get_user_by_id(user_id)

    def approve_seller(self, user_id: int, approve: bool = True) -> User:
        return self._user_system().approve_seller(user_id, approve=approve)

    def search_users(
        self, search_query: str, skip: int = 0, limit: int = 50
    ) -> tuple[List[User], int]:
        return self._user_system().search_users(search_query, skip=skip, limit=limit)

    def delete_user(self, user_id: int) -> bool:
        return self._user_system().delete_user(user_id)

    def get_all_stores(self, skip: int = 0, limit: int = 50) -> tuple[List[Store], int]:
        return self._store_system().get_all_stores(skip=skip, limit=limit)

    def search_stores(
        self, search_query: str, skip: int = 0, limit: int = 50
    ) -> tuple[List[Store], int]:
        return self._store_system().search_stores(search_query, skip=skip, limit=limit)

    def get_all_products(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[ProductStatus] = None,
    ) -> tuple[List[Product], int]:
        return self._product_system().get_all_products(skip=skip, limit=limit, status=status)

    def hide_product(self, product_id: int) -> Product:
        return self._product_system().hide_product(product_id)

    def unhide_product(self, product_id: int) -> Product:
        return self._product_system().unhide_product(product_id)

    def get_platform_statistics(self) -> dict:
        today = datetime.utcnow().date()
        return {
            'users': {
                'total': self.db.query(func.count(User.id)).scalar() or 0,
                'buyers': self.db.query(func.count(User.id)).filter(User.role == UserRole.BUYER).scalar() or 0,
                'sellers': self.db.query(func.count(User.id)).filter(User.role == UserRole.SELLER).scalar() or 0,
                'pending_seller_approvals': self.db.query(func.count(User.id)).filter(
                    User.role == UserRole.SELLER, User.selling_approve.is_(False)
                ).scalar() or 0,
            },
            'stores': {'total': self.db.query(func.count(Store.id)).scalar() or 0},
            'products': {
                'total': self.db.query(func.count(Product.id)).scalar() or 0,
                'active': self.db.query(func.count(Product.id)).filter(Product.status == ProductStatus.ACTIVE).scalar() or 0,
            },
            'inquiries': {
                'total': self.db.query(func.count(Inquiry.id)).scalar() or 0,
                'today': self.db.query(func.count(Inquiry.id)).filter(
                    func.date(Inquiry.created_at) == today
                ).scalar() or 0,
            },
        }
