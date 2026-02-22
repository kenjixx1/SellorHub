"""
Inquiry routes - buyer inquiry submission and seller inquiry management.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_seller, get_user_store, Pagination
from app.models.user import User
from app.models.store import Store
from app.models.inquiry import InquiryStatus
from app.schemas.inquiry import InquiryCreate, InquiryUpdate, InquiryResponse
from app.services.inquiry_service import InquiryService

router = APIRouter(prefix="/api/inquiries", tags=["Inquiries"])


# ─── Public Routes ────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=InquiryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a product inquiry",
    description="Send a message to a seller about a specific product. No account required."
)
def create_inquiry(
    inquiry_data: InquiryCreate,
    db: Session = Depends(get_db)
):
    """Submit a buyer inquiry about a product."""
    service = InquiryService(db)
    return service.create_inquiry(inquiry_data)


# ─── Seller Routes ────────────────────────────────────────────────────────────

@router.get(
    "",
    summary="List my store's inquiries",
    description="View all inquiries received for your store. Filter by status."
)
def list_my_inquiries(
    inquiry_status: Optional[InquiryStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """List inquiries for the seller's store."""
    pagination = Pagination(page=page, limit=limit)
    service = InquiryService(db)

    inquiries, total = service.get_store_inquiries(
        store_id=store.id,
        status=inquiry_status,
        skip=pagination.offset,
        limit=pagination.limit
    )

    return pagination.get_response(total=total, items=inquiries)


@router.get(
    "/stats",
    summary="Get inquiry statistics",
    description="Returns inquiry counts by status (new, replied, closed) for your store."
)
def get_inquiry_stats(
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Get inquiry statistics for the seller's store."""
    service = InquiryService(db)
    return service.get_inquiry_statistics(store.id)


@router.get(
    "/{inquiry_id}",
    response_model=InquiryResponse,
    summary="Get a single inquiry",
    description="View the full details of a single inquiry."
)
def get_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Get a single inquiry by ID (must belong to seller's store)."""
    service = InquiryService(db)
    inquiry = service.get_inquiry_by_id(inquiry_id)

    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )

    if inquiry.store_id != store.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This inquiry does not belong to your store"
        )

    return inquiry


@router.put(
    "/{inquiry_id}/status",
    response_model=InquiryResponse,
    summary="Update inquiry status",
    description="Mark an inquiry as replied or closed."
)
def update_inquiry_status(
    inquiry_id: int,
    update_data: InquiryUpdate,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Update the status of an inquiry."""
    service = InquiryService(db)
    return service.update_inquiry_status(inquiry_id, update_data, store_id=store.id)


@router.delete(
    "/{inquiry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an inquiry",
    description="Permanently delete an inquiry from your store."
)
def delete_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Delete an inquiry from the seller's store."""
    service = InquiryService(db)
    service.delete_inquiry(inquiry_id, store_id=store.id)
