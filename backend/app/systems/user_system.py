"""
UserSystem - application-layer orchestration for user accounts and addresses.
"""
from typing import Optional, List

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.address import Address
from app.models.user import User, UserRole
from app.schemas.address import AddressCreate, AddressUpdate
from app.schemas.user import UserUpdate


class UserSystem:
    """Orchestrates user profile, address-book, and account admin workflows."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_all_users(
        self, role: Optional[UserRole] = None, skip: int = 0, limit: int = 50
    ) -> tuple[List[User], int]:
        query = self.db.query(User)
        if role is not None:
            query = query.filter(User.role == role)
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return users, total

    def search_users(
        self, search_query: str, skip: int = 0, limit: int = 50
    ) -> tuple[List[User], int]:
        query = self.db.query(User).filter(
            or_(
                User.username.ilike(f'%{search_query}%'),
                User.email.ilike(f'%{search_query}%'),
            )
        )
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        return users, total

    def get_pending_sellers(self, skip: int = 0, limit: int = 50) -> tuple[List[User], int]:
        query = self.db.query(User).filter(
            User.role == UserRole.SELLER, User.selling_approve == False
        )
        total = query.count()
        sellers = query.order_by(User.created_at.asc()).offset(skip).limit(limit).all()
        return sellers, total

    def approve_seller(self, user_id: int, approve: bool = True) -> User:
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        if user.role != UserRole.SELLER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='User is not a seller',
            )
        user.selling_approve = approve
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user_profile(self, user_id: int, update_data: UserUpdate) -> User:
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        if update_data.username is not None:
            if self.db.query(User).filter(User.username == update_data.username, User.id != user_id).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Username already taken')
            user.username = update_data.username
        if update_data.email is not None:
            if self.db.query(User).filter(User.email == update_data.email, User.id != user_id).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already taken')
            user.email = update_data.email
        if update_data.phone_number is not None:
            user.phone_number = update_data.phone_number
        if update_data.avatar_url is not None:
            user.avatar_url = update_data.avatar_url
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int) -> bool:
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        self.db.delete(user)
        self.db.commit()
        return True

    def list_addresses(self, user_id: int) -> List[Address]:
        return (
            self.db.query(Address)
            .filter(Address.user_id == user_id)
            .order_by(Address.is_default.desc(), Address.created_at.desc())
            .all()
        )

    def get_address(self, address_id: int, user_id: int) -> Address:
        addr = self.db.query(Address).filter(
            Address.id == address_id, Address.user_id == user_id
        ).first()
        if not addr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Address not found')
        return addr

    def create_address(self, user_id: int, data: AddressCreate) -> Address:
        if data.is_default:
            self._clear_defaults(user_id)
        addr = Address(user_id=user_id, **data.model_dump())
        self.db.add(addr)
        self.db.commit()
        self.db.refresh(addr)
        return addr

    def update_address(self, address_id: int, user_id: int, data: AddressUpdate) -> Address:
        addr = self.get_address(address_id, user_id)
        update_dict = data.model_dump(exclude_unset=True)
        if update_dict.get('is_default'):
            self._clear_defaults(user_id)
        for key, value in update_dict.items():
            setattr(addr, key, value)
        self.db.commit()
        self.db.refresh(addr)
        return addr

    def delete_address(self, address_id: int, user_id: int) -> bool:
        addr = self.get_address(address_id, user_id)
        self.db.delete(addr)
        self.db.commit()
        return True

    def _clear_defaults(self, user_id: int) -> None:
        self.db.query(Address).filter(
            Address.user_id == user_id, Address.is_default == True
        ).update({'is_default': False})
