from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.dependencies import get_current_admin, Pagination
from app.models.user import User, UserRole
from app.models.product import ProductStatus
from app.schemas.user import UserResponse
from app.systems.admin_system import AdminSystem
from app.systems.user_system import UserSystem
router = APIRouter(prefix='/api/admin', tags=['Admin'])

class ApproveSellerRequest(BaseModel):
    approve: bool

@router.get('/stats', summary='Platform statistics', description='Returns total users, stores, products, and inquiry counts.')
def get_stats(admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    system = AdminSystem(db)
    return system.get_platform_statistics()

@router.get('/users', summary='List all users', description='Paginated list of all users. Filter by role.')
def list_users(role: Optional[UserRole]=Query(None), search: Optional[str]=Query(None, description='Search by username or email'), page: int=Query(1, ge=1), limit: int=Query(50, ge=1, le=100), admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    pagination = Pagination(page=page, limit=limit)
    system = AdminSystem(db)
    if search:
        users, total = system.search_users(search, skip=pagination.offset, limit=pagination.limit)
    else:
        users, total = system.get_all_users(role=role, skip=pagination.offset, limit=pagination.limit)
    return pagination.get_response(total=total, items=users)

@router.get('/users/pending-sellers', summary='List pending seller approvals', description='Returns sellers who have registered but not yet been approved.')
def list_pending_sellers(page: int=Query(1, ge=1), limit: int=Query(50, ge=1, le=100), admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    pagination = Pagination(page=page, limit=limit)
    system = AdminSystem(db)
    sellers, total = system.get_pending_sellers(skip=pagination.offset, limit=pagination.limit)
    return pagination.get_response(total=total, items=sellers)

@router.get('/users/{user_id}', response_model=UserResponse, summary='Get user details', description='View full details for a specific user.')
def get_user(user_id: int, admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    system = UserSystem(db)
    user = system.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    return user

@router.put('/users/{user_id}/approve-seller', response_model=UserResponse, summary='Approve or reject a seller', description='Grant or revoke seller approval. Approved sellers can create stores.')
def approve_seller(user_id: int, body: ApproveSellerRequest, admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    system = AdminSystem(db)
    return system.approve_seller(user_id, approve=body.approve)

@router.delete('/users/{user_id}', status_code=status.HTTP_204_NO_CONTENT, summary='Delete a user', description='Permanently delete a user account and all associated data.')
def delete_user(user_id: int, admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You cannot delete your own admin account')
    system = UserSystem(db)
    system.delete_user(user_id)

@router.get('/stores', summary='List all stores', description='Admin view of all stores on the platform.')
def list_all_stores(search: Optional[str]=Query(None), page: int=Query(1, ge=1), limit: int=Query(50, ge=1, le=100), admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    from app.systems.store_system import StoreSystem
    pagination = Pagination(page=page, limit=limit)
    system = AdminSystem(db)
    store_system = StoreSystem(db)
    if search:
        stores, total = store_system.search_stores(search, skip=pagination.offset, limit=pagination.limit)
    else:
        stores, total = system.get_all_stores(skip=pagination.offset, limit=pagination.limit)
    return pagination.get_response(total=total, items=stores)

@router.get('/products', summary='List all products', description='Admin view of all products. Filter by status.')
def list_all_products(product_status: Optional[ProductStatus]=Query(None, alias='status'), page: int=Query(1, ge=1), limit: int=Query(50, ge=1, le=100), admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    pagination = Pagination(page=page, limit=limit)
    system = AdminSystem(db)
    products, total = system.get_all_products(skip=pagination.offset, limit=pagination.limit, status=product_status)
    return pagination.get_response(total=total, items=products)

@router.put('/products/{product_id}/hide', summary='Hide a product', description='Hide a product from public view (moderation action).')
def hide_product(product_id: int, admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    system = AdminSystem(db)
    product = system.hide_product(product_id)
    return {'message': f"Product '{product.title}' has been hidden", 'product_id': product.id}

@router.put('/products/{product_id}/unhide', summary='Unhide a product', description='Restore a hidden product to active status.')
def unhide_product(product_id: int, admin: User=Depends(get_current_admin), db: Session=Depends(get_db)):
    system = AdminSystem(db)
    product = system.unhide_product(product_id)
    return {'message': f"Product '{product.title}' is now active", 'product_id': product.id}
