"""
Order routes - checkout, buyer/seller order management.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_current_active_seller, get_user_store, Pagination
from app.models.user import User
from app.models.store import Store
from app.models.order import OrderStatus
from app.schemas.order import OrderCreate, OrderResponse, CheckoutFromCart, OrderStatusUpdate
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/orders", tags=["Orders"])


# ── Buyer endpoints ───────────────────────────────────────────────────────────

@router.post(
    "/checkout/cart",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Checkout from cart",
    description="Create an order from the current user's cart items for a specific store.",
)
def checkout_from_cart(
    data: CheckoutFromCart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Checkout using items in the cart for one store."""
    return OrderService(db).create_order_from_cart(
        buyer_id=current_user.id,
        store_id=data.store_id,
        shipping_address_id=data.shipping_address_id,
    )


@router.post(
    "/checkout",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Direct checkout",
    description="Create an order by specifying items directly (bypasses cart).",
)
def checkout_direct(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Direct checkout with explicit item list."""
    return OrderService(db).create_order_direct(current_user.id, data)


@router.get(
    "/mine",
    summary="List my orders",
    description="Returns the current buyer's orders with pagination.",
)
def list_my_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pagination = Pagination(page=page, limit=limit)
    orders, total = OrderService(db).list_buyer_orders(current_user.id, skip=pagination.offset, limit=pagination.limit)
    return pagination.get_response(total=total, items=[_order_dict(o) for o in orders])


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get order detail",
    description="Get a single order by ID. Buyer sees own orders; seller sees store orders.",
)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = OrderService(db)
    order = service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.buyer_id != current_user.id:
        store = db.query(Store).filter(Store.id == order.store_id, Store.owner_id == current_user.id).first()
        if not store:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return order


# ── Seller endpoints ──────────────────────────────────────────────────────────

@router.get(
    "/store/list",
    summary="List orders for my store",
    description="Returns orders placed at the seller's store.",
)
def list_store_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db),
):
    pagination = Pagination(page=page, limit=limit)
    orders, total = OrderService(db).list_store_orders(store.id, skip=pagination.offset, limit=pagination.limit, status_filter=status_filter)
    return pagination.get_response(total=total, items=[_order_dict(o) for o in orders])


@router.put(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Update order status",
    description="Seller updates the status of an order in their store.",
)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_user: User = Depends(get_current_active_seller),
    store: Store = Depends(get_user_store),
    db: Session = Depends(get_db),
):
    service = OrderService(db)
    order = service.get_order(order_id)
    if not order or order.store_id != store.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return service.update_order_status(order_id, data.status, current_user.id, data.note)


# ── helper ─────────────────────────────────────────────────────────────────────

def _order_dict(order) -> dict:
    return {
        "id": order.id,
        "order_number": order.order_number,
        "buyer_id": order.buyer_id,
        "store_id": order.store_id,
        "status": order.status,
        "total_amount": order.total_amount,
        "currency": order.currency,
        "shipping_address_id": order.shipping_address_id,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": it.id,
                "product_id": it.product_id,
                "product_title_snapshot": it.product_title_snapshot,
                "unit_price_snapshot": it.unit_price_snapshot,
                "quantity": it.quantity,
            }
            for it in order.items
        ],
    }
