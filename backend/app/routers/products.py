"""
Product routes - public product browsing and seller product management.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_seller, get_user_store, Pagination
from app.models.user import User
from app.models.store import Store
from app.models.product import ProductStatus
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.schemas.product_image import ProductImageCreate, ProductImageResponse
from app.services.product_service import ProductService
from app.utils.storage import save_upload_file

router = APIRouter(prefix="/api/products", tags=["Products"])


# ─── Public Routes ────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=ProductListResponse,
    summary="Search and filter products",
    description="Search products across all stores. Supports keyword search, price range, category, and sorting."
)
def search_products(
    search: Optional[str] = Query(None, description="Search in product title and description"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    group_ids: Optional[List[int]] = Query(None, description="Filter by category IDs"),
    store_ids: Optional[List[int]] = Query(None, description="Filter by store IDs"),
    sort_by: str = Query("newest", enum=["newest", "price_asc", "price_desc", "alphabetical"]),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search and filter products across all stores."""
    pagination = Pagination(page=page, limit=limit)
    service = ProductService(db)

    products, total = service.search_products(
        search_query=search,
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
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get product details",
    description="Returns full product details including all images, description, and seller information."
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get a product by ID (public, active products only)."""
    service = ProductService(db)
    product = service.get_product_by_id(product_id, include_hidden=False)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return product


# ─── Seller Routes ────────────────────────────────────────────────────────────

@router.get(
    "/seller/list",
    response_model=ProductListResponse,
    summary="List seller's own products",
    description="Returns all products in the seller's store, including hidden ones."
)
def list_my_products(
    group_id: Optional[int] = Query(None),
    product_status: Optional[ProductStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """List all products in the seller's store (including hidden)."""
    pagination = Pagination(page=page, limit=limit)
    service = ProductService(db)

    products, total = service.get_store_products(
        store_id=store.id,
        skip=pagination.offset,
        limit=pagination.limit,
        group_id=group_id,
        status=product_status,
        include_hidden=True
    )

    pages = (total + pagination.limit - 1) // pagination.limit
    return ProductListResponse(products=products, total=total, page=page, pages=pages)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product",
    description="Add a new product to your store."
)
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Create a new product in the seller's store."""
    service = ProductService(db)
    return service.create_product(product_data, store_id=store.id)


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update a product",
    description="Update product details. Only the product owner can update it."
)
def update_product(
    product_id: int,
    update_data: ProductUpdate,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Update a product in the seller's store."""
    service = ProductService(db)
    return service.update_product(product_id, update_data, store_id=store.id)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
    description="Permanently delete a product. Only the product owner can delete it."
)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Delete a product from the seller's store."""
    service = ProductService(db)
    service.delete_product(product_id, store_id=store.id)


# ─── Product Image Routes ──────────────────────────────────────────────────────

@router.post(
    "/{product_id}/images",
    response_model=ProductImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload product image",
    description="Upload an image for a product. Max 5 images per product. Supported: JPEG, PNG, WebP."
)
async def upload_product_image(
    product_id: int,
    position: int = Query(..., ge=0, le=4, description="Display order (0 = thumbnail)"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Upload an image for a product."""
    # Verify product belongs to this store
    product_service = ProductService(db)
    product = product_service.get_product_by_id(product_id, include_hidden=True)

    if not product or product.store_id != store.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Upload to storage
    image_url = await save_upload_file(file, subfolder="products")

    # Save image record
    image_data = ProductImageCreate(
        product_id=product_id,
        image_url=image_url,
        position=position
    )

    return product_service.add_product_image(image_data)


@router.delete(
    "/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete product image",
    description="Remove an image from a product."
)
def delete_product_image(
    product_id: int,
    image_id: int,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Delete a product image."""
    service = ProductService(db)
    service.delete_product_image(image_id, store_id=store.id)


@router.put(
    "/{product_id}/images/reorder",
    response_model=list[ProductImageResponse],
    summary="Reorder product images",
    description="Update display order of product images. Provide a dict mapping image_id to new position."
)
def reorder_product_images(
    product_id: int,
    image_positions: dict[int, int],
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Reorder product images."""
    service = ProductService(db)
    return service.reorder_product_images(product_id, image_positions, store_id=store.id)
