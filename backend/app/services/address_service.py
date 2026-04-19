from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate

class AddressService:

    def __init__(self, db: Session):
        self.db = db

    def list_addresses(self, user_id: int) -> List[Address]:
        return self.db.query(Address).filter(Address.user_id == user_id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()

    def get_address(self, address_id: int, user_id: int) -> Address:
        addr = self.db.query(Address).filter(Address.id == address_id, Address.user_id == user_id).first()
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
        for k, v in update_dict.items():
            setattr(addr, k, v)
        self.db.commit()
        self.db.refresh(addr)
        return addr

    def delete_address(self, address_id: int, user_id: int) -> bool:
        addr = self.get_address(address_id, user_id)
        self.db.delete(addr)
        self.db.commit()
        return True

    def _clear_defaults(self, user_id: int):
        self.db.query(Address).filter(Address.user_id == user_id, Address.is_default == True).update({'is_default': False})