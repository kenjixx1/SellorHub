"""
Product group (category) routes - managing product categories within a store.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_active_seller, get_user_store
from app.models.user import User
from app.models.store import Store
from app.schemas.product_group import ProductGroupCreate, ProductGroupResponse
from app.services.product_group_service import ProductGroupService

router = APIRouter(prefix="/api/product-groups", tags=["Product Categories"])


class ProductGroupNameUpdate(BaseModel):
    """Schema for renaming a product group."""
    name: str


@router.post(
    "",
    response_model=ProductGroupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a product category",
    description="Add a new category to your store for organizing products."
)
def create_product_group(
    group_data: ProductGroupCreate,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Create a new product category in the seller's store."""
    service = ProductGroupService(db)
    group = service.create_product_group(group_data, store_id=store.id)

    return {
        "id": group.id,
        "name": group.name,
        "store_id": group.store_id,
        "created_at": group.created_at,
        "product_count": 0,
    }


@router.get(
    "/my-store",
    response_model=list[ProductGroupResponse],
    summary="List my store's categories",
    description="Returns all categories in your store with product counts."
)
def list_my_product_groups(
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """List all categories for the seller's store."""
    service = ProductGroupService(db)
    return service.get_store_product_groups_with_counts(store.id)


@router.put(
    "/{group_id}",
    response_model=ProductGroupResponse,
    summary="Rename a product category",
    description="Update the name of a product category."
)
def update_product_group(
    group_id: int,
    update_data: ProductGroupNameUpdate,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Update a product category name."""
    service = ProductGroupService(db)
    group = service.update_product_group(group_id, update_data.name, store_id=store.id)

    return {
        "id": group.id,
        "name": group.name,
        "store_id": group.store_id,
        "created_at": group.created_at,
        "product_count": 0,
    }


@router.delete(
    "/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product category",
    description="Delete a category. Products in this category will become uncategorized."
)
def delete_product_group(
    group_id: int,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db)
):
    """Delete a product category from the seller's store."""
    service = ProductGroupService(db)
    service.delete_product_group(group_id, store_id=store.id)
