"""
Admin routes - platform administration, user management, and moderation.
All routes require admin role.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_admin, Pagination
from app.models.user import User, UserRole
from app.models.product import ProductStatus
from app.schemas.user import UserResponse
from app.services.admin_service import AdminService
from app.services.user_service import UserService

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class ApproveSellerRequest(BaseModel):
    approve: bool


# ─── Platform Statistics ──────────────────────────────────────────────────────

@router.get(
    "/stats",
    summary="Platform statistics",
    description="Returns total users, stores, products, and inquiry counts."
)
def get_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get platform-wide statistics."""
    service = AdminService(db)
    return service.get_platform_statistics()


# ─── User Management ──────────────────────────────────────────────────────────

@router.get(
    "/users",
    summary="List all users",
    description="Paginated list of all users. Filter by role."
)
def list_users(
    role: Optional[UserRole] = Query(None),
    search: Optional[str] = Query(None, description="Search by username or email"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all users."""
    pagination = Pagination(page=page, limit=limit)
    service = AdminService(db)

    if search:
        users, total = service.search_users(search, skip=pagination.offset, limit=pagination.limit)
    else:
        users, total = service.get_all_users(role=role, skip=pagination.offset, limit=pagination.limit)

    return pagination.get_response(total=total, items=users)


@router.get(
    "/users/pending-sellers",
    summary="List pending seller approvals",
    description="Returns sellers who have registered but not yet been approved."
)
def list_pending_sellers(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List sellers awaiting approval."""
    pagination = Pagination(page=page, limit=limit)
    service = AdminService(db)
    sellers, total = service.get_pending_sellers(skip=pagination.offset, limit=pagination.limit)
    return pagination.get_response(total=total, items=sellers)


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get user details",
    description="View full details for a specific user."
    )
def get_user(user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get a user by ID."""
    service = UserService(db)
    user = service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.put(
    "/users/{user_id}/approve-seller",
    response_model=UserResponse,
    summary="Approve or reject a seller",
    description="Grant or revoke seller approval. Approved sellers can create stores."
)
def approve_seller(
    user_id: int,
    body: ApproveSellerRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve or reject a seller application."""
    service = AdminService(db)
    return service.approve_seller(user_id, approve=body.approve)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a user",
    description="Permanently delete a user account and all associated data."
)
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a user account."""
    # Prevent admin from deleting themselves
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account"
        )

    service = UserService(db)
    service.delete_user(user_id)


# ─── Store Management ─────────────────────────────────────────────────────────

@router.get(
    "/stores",
    summary="List all stores",
    description="Admin view of all stores on the platform."
)
def list_all_stores(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all stores."""
    from app.services.store_service import StoreService
    pagination = Pagination(page=page, limit=limit)
    service = AdminService(db)
    store_service = StoreService(db)

    if search:
        stores, total = store_service.search_stores(search, skip=pagination.offset, limit=pagination.limit)
    else:
        stores, total = service.get_all_stores(skip=pagination.offset, limit=pagination.limit)

    return pagination.get_response(total=total, items=stores)


# ─── Product Moderation ────────────────────────────────────────────────────────

@router.get(
    "/products",
    summary="List all products",
    description="Admin view of all products. Filter by status."
)
def list_all_products(
    product_status: Optional[ProductStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all products on the platform."""
    pagination = Pagination(page=page, limit=limit)
    service = AdminService(db)
    products, total = service.get_all_products(
        skip=pagination.offset,
        limit=pagination.limit,
        status=product_status
    )
    return pagination.get_response(total=total, items=products)


@router.put(
    "/products/{product_id}/hide",
    summary="Hide a product",
    description="Hide a product from public view (moderation action)."
)
def hide_product(
    product_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Hide a product (content moderation)."""
    service = AdminService(db)
    product = service.hide_product(product_id)
    return {"message": f"Product '{product.title}' has been hidden", "product_id": product.id}


@router.put(
    "/products/{product_id}/unhide",
    summary="Unhide a product",
    description="Restore a hidden product to active status."
)
def unhide_product(
    product_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Unhide a product (restore to active)."""
    service = AdminService(db)
    product = service.unhide_product(product_id)
    return {"message": f"Product '{product.title}' is now active", "product_id": product.id}
