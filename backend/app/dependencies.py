from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.store import Store
from app.utils.security import decode_access_token
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials=Depends(security), db: Session=Depends(get_db)) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate credentials', headers={'WWW-Authenticate': 'Bearer'})
    user_id: Optional[int] = payload.get('sub')
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate credentials', headers={'WWW-Authenticate': 'Bearer'})
    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate credentials', headers={'WWW-Authenticate': 'Bearer'})
    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found', headers={'WWW-Authenticate': 'Bearer'})
    return user

def get_current_buyer(current_user: User=Depends(get_current_user)) -> User:
    if current_user.role != UserRole.BUYER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only buyers can access this resource')
    return current_user

def get_current_active_seller(current_user: User=Depends(get_current_user)) -> User:
    if current_user.role != UserRole.SELLER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only sellers can access this resource')
    if not current_user.selling_approve:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Seller account is not approved yet')
    return current_user

def get_current_admin(current_user: User=Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only administrators can access this resource')
    return current_user

def get_user_store(current_user: User=Depends(get_current_active_seller), db: Session=Depends(get_db)) -> Store:
    store = db.query(Store).filter(Store.owner_id == current_user.id).first()
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You don't have a store yet. Please create one first.")
    return store

def verify_store_ownership(store_id: int, current_user: User=Depends(get_current_active_seller), db: Session=Depends(get_db)) -> Store:
    store = db.query(Store).filter(Store.id == store_id).first()
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Store not found')
    if store.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to access this store")
    return store

class Pagination:

    def __init__(self, page: int=1, limit: int=20):
        from app.config import settings
        self.page = max(1, page)
        self.limit = min(limit, settings.MAX_PAGE_SIZE)
        self.offset = (self.page - 1) * self.limit

    def get_response(self, total: int, items: list) -> dict:
        pages = (total + self.limit - 1) // self.limit
        return {'items': items, 'total': total, 'page': self.page, 'pages': pages, 'limit': self.limit}