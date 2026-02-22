"""
Store routes - public store browsing and seller store management.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_current_active_seller, Pagination
from app.models.user import User
from app.schemas.store import StoreCreate, StoreUpdate, StoreResponse
from app.schemas.product import ProductResponse, ProductListResponse
from app.models.product import ProductStatus
from app.services.store_service import StoreService
from app.services.product_service import ProductService
from app.services.product_group_service import ProductGroupService
from app.schemas.product_group import ProductGroupResponse

router = APIRouter(prefix="/api/stores", tags=["Stores"])


# ─── Public Routes ────────────────────────────────────────────────────────────

@router.get(
    "",
    summary="List all stores",
    description="Browse all stores on the marketplace. Supports pagination and search."
)
def list_stores(
    search: Optional[str] = Query(None, description="Search stores by name or description"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all stores with optional search and pagination."""
    service = StoreService(db)
    pagination = Pagination(page=page, limit=limit)

    if search:
        stores, total = service.search_stores(search, skip=pagination.offset, limit=pagination.limit)
    else:
        stores, total = service.get_all_stores(skip=pagination.offset, limit=pagination.limit)

    # Attach product counts
    product_service = ProductService(db)
    results = []
    for store in stores:
        _, count = product_service.get_store_products(
            store.id, skip=0, limit=1, status=ProductStatus.ACTIVE
        )
        store_dict = {
            "id": store.id,
            "slug": store.slug,
            "name": store.name,
            "description": store.description,
            "logo_url": store.logo_url,
            "owner_id": store.owner_id,
            "created_at": store.created_at,
            "product_count": count,
        }
        results.append(store_dict)

    return pagination.get_response(total=total, items=results)


@router.get(
    "/{slug}",
    summary="Get store by slug",
    description="View a store's public profile page."
)
def get_store(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get a store's public information by its slug."""
    service = StoreService(db)
    store = service.get_store_by_slug(slug)

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store '{slug}' not found"
        )

    product_service = ProductService(db)
    _, product_count = product_service.get_store_products(
        store.id, skip=0, limit=1, status=ProductStatus.ACTIVE
    )

    return {
        "id": store.id,
        "slug": store.slug,
        "name": store.name,
        "description": store.description,
        "logo_url": store.logo_url,
        "owner_id": store.owner_id,
        "created_at": store.created_at,
        "product_count": product_count,
    }


@router.get(
    "/{slug}/products",
    response_model=ProductListResponse,
    summary="Get products for a store",
    description="Browse products listed in a specific store. Supports filtering and pagination."
)
def get_store_products(
    slug: str,
    group_id: Optional[int] = Query(None, description="Filter by product category"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort_by: str = Query("newest", enum=["newest", "price_asc", "price_desc", "alphabetical"]),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all active products for a store with filters."""
    store_service = StoreService(db)
    store = store_service.get_store_by_slug(slug)

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store '{slug}' not found"
        )

    pagination = Pagination(page=page, limit=limit)
    product_service = ProductService(db)

    store_ids = [store.id]
    group_ids = [group_id] if group_id else None

    products, total = product_service.search_products(
        min_price=min_price,
        max_price=max_price,
        group_ids=group_ids,
        store_ids=store_ids,
        status=ProductStatus.ACTIVE,
        skip=pagination.offset,
        limit=pagination.limit,
        sort_by=sort_by
    )

    pages = (total + pagination.limit - 1) // pagination.limit
    return ProductListResponse(products=products, total=total, page=page, pages=pages)


@router.get(
    "/{slug}/groups",
    response_model=list[ProductGroupResponse],
    summary="Get product categories for a store",
    description="Returns all product categories in a store with product counts."
)
def get_store_groups(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get all product categories for a store."""
    store_service = StoreService(db)
    store = store_service.get_store_by_slug(slug)

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store '{slug}' not found"
        )

    group_service = ProductGroupService(db)
    groups_with_counts = group_service.get_store_product_groups_with_counts(store.id)

    return groups_with_counts


# ─── Seller Routes ────────────────────────────────────────────────────────────

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a store",
    description="Create your seller store. Requires an approved seller account. Only one store per seller."
)
def create_store(
    store_data: StoreCreate,
    current_user: User = Depends(get_current_active_seller),
    db: Session = Depends(get_db)
):
    """Create a new store (approved sellers only)."""
    service = StoreService(db)
    return service.create_store(store_data, owner_id=current_user.id)


@router.put(
    "/me",
    summary="Update your store",
    description="Update your store's name, description, or logo. The slug cannot be changed."
)
def update_my_store(
    update_data: StoreUpdate,
    current_user: User = Depends(get_current_active_seller),
    db: Session = Depends(get_db)
):
    """Update the current seller's store."""
    service = StoreService(db)
    store = service.get_store_by_owner_id(current_user.id)

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a store yet. Create one first."
        )

    return service.update_store(store.id, update_data)


@router.get(
    "/me/dashboard",
    summary="Get seller dashboard info",
    description="Returns store stats: product counts and inquiry counts."
)
def get_my_dashboard(
    current_user: User = Depends(get_current_active_seller),
    db: Session = Depends(get_db)
):
    """Get seller dashboard statistics."""
    from app.services.inquiry_service import InquiryService

    store_service = StoreService(db)
    store = store_service.get_store_by_owner_id(current_user.id)

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a store yet. Create one first."
        )

    product_service = ProductService(db)
    inquiry_service = InquiryService(db)

    _, total_products = product_service.get_store_products(store.id, skip=0, limit=1, include_hidden=True)
    _, active_products = product_service.get_store_products(
        store.id, skip=0, limit=1, status=ProductStatus.ACTIVE
    )
    inquiry_stats = inquiry_service.get_inquiry_statistics(store.id)

    # Recent 5 inquiries
    recent_inquiries, _ = inquiry_service.get_store_inquiries(store.id, skip=0, limit=5)

    return {
        "store": {
            "id": store.id,
            "name": store.name,
            "slug": store.slug,
        },
        "stats": {
            "total_products": total_products,
            "active_products": active_products,
            "inquiries": inquiry_stats,
        },
        "recent_inquiries": recent_inquiries,
    }
