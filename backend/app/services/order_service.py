"""
Order service for checkout and order management.
"""
import uuid
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.order_status_history import OrderStatusHistory
from app.models.product import Product, ProductStatus
from app.models.store import Store
from app.models.address import Address
from app.models.cart import CartItem
from app.schemas.order import OrderCreate


class OrderService:
    """Service for order and checkout operations."""

    def __init__(self, db: Session):
        self.db = db

    # ── checkout ───────────────────────────────────────────────────────────────

    def create_order_from_cart(self, buyer_id: int, store_id: int, shipping_address_id: int) -> Order:
        """
        Create an order from the buyer's cart items that belong to a single store.
        Validates stock, snapshots prices, computes total, clears cart items used.
        """
        address = (
            self.db.query(Address)
            .filter(Address.id == shipping_address_id, Address.user_id == buyer_id)
            .first()
        )
        if not address:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shipping address not found")

        store = self.db.query(Store).filter(Store.id == store_id).first()
        if not store:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

        cart_items: List[CartItem] = (
            self.db.query(CartItem)
            .join(Product)
            .filter(CartItem.user_id == buyer_id, Product.store_id == store_id)
            .all()
        )
        if not cart_items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No cart items for this store")

        order_items: list[OrderItem] = []
        total = Decimal("0")

        for ci in cart_items:
            product = ci.product
            if product.status != ProductStatus.ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.title}' is no longer available",
                )
            if product.stock is not None and product.stock < ci.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for '{product.title}' (available: {product.stock})",
                )
            line_total = Decimal(str(product.price)) * ci.quantity
            total += line_total
            order_items.append(
                OrderItem(
                    product_id=product.id,
                    product_title_snapshot=product.title,
                    unit_price_snapshot=product.price,
                    quantity=ci.quantity,
                )
            )
            if product.stock is not None:
                product.stock -= ci.quantity

        order = Order(
            order_number=f"ORD-{uuid.uuid4().hex[:10].upper()}",
            buyer_id=buyer_id,
            store_id=store_id,
            status=OrderStatus.PLACED,
            total_amount=total,
            currency="THB",
            shipping_address_id=shipping_address_id,
            items=order_items,
        )
        self.db.add(order)

        initial_history = OrderStatusHistory(
            order=order,
            status=OrderStatus.PLACED,
            note="Order placed",
            changed_by_user_id=buyer_id,
        )
        self.db.add(initial_history)

        for ci in cart_items:
            self.db.delete(ci)

        self.db.commit()
        self.db.refresh(order)
        return order

    def create_order_direct(self, buyer_id: int, data: OrderCreate) -> Order:
        """Create an order from an explicit item list (bypasses cart)."""
        address = (
            self.db.query(Address)
            .filter(Address.id == data.shipping_address_id, Address.user_id == buyer_id)
            .first()
        )
        if not address:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shipping address not found")

        store = self.db.query(Store).filter(Store.id == data.store_id).first()
        if not store:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

        order_items: list[OrderItem] = []
        total = Decimal("0")

        for item in data.items:
            product = self.db.query(Product).filter(Product.id == item.product_id).first()
            if not product or product.store_id != data.store_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product {item.product_id} not found in store")
            if product.status != ProductStatus.ACTIVE:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product '{product.title}' is not available")
            if product.stock is not None and product.stock < item.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for '{product.title}'")
            line_total = Decimal(str(product.price)) * item.quantity
            total += line_total
            order_items.append(
                OrderItem(
                    product_id=product.id,
                    product_title_snapshot=product.title,
                    unit_price_snapshot=product.price,
                    quantity=item.quantity,
                )
            )
            if product.stock is not None:
                product.stock -= item.quantity

        order = Order(
            order_number=f"ORD-{uuid.uuid4().hex[:10].upper()}",
            buyer_id=buyer_id,
            store_id=data.store_id,
            status=OrderStatus.PLACED,
            total_amount=total,
            currency="THB",
            shipping_address_id=data.shipping_address_id,
            items=order_items,
        )
        self.db.add(order)
        self.db.add(OrderStatusHistory(order=order, status=OrderStatus.PLACED, note="Order placed", changed_by_user_id=buyer_id))
        self.db.commit()
        self.db.refresh(order)
        return order

    # ── queries ────────────────────────────────────────────────────────────────

    def get_order(self, order_id: int) -> Optional[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.id == order_id)
            .first()
        )

    def list_buyer_orders(self, buyer_id: int, skip: int = 0, limit: int = 20) -> Tuple[List[Order], int]:
        q = self.db.query(Order).filter(Order.buyer_id == buyer_id)
        total = q.count()
        orders = q.options(joinedload(Order.items)).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return orders, total

    def list_store_orders(self, store_id: int, skip: int = 0, limit: int = 20, status_filter: Optional[OrderStatus] = None) -> Tuple[List[Order], int]:
        q = self.db.query(Order).filter(Order.store_id == store_id)
        if status_filter:
            q = q.filter(Order.status == status_filter)
        total = q.count()
        orders = q.options(joinedload(Order.items)).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return orders, total

    # ── status updates ─────────────────────────────────────────────────────────

    # Valid transitions and who may trigger each:
    #   is_seller=True means the caller owns the order's store
    #   is_buyer=True means the caller is the order's buyer
    _SELLER_TRANSITIONS = {
        OrderStatus.PLACED: {OrderStatus.PAID, OrderStatus.PACKING, OrderStatus.CANCELLED},
        OrderStatus.PAID: {OrderStatus.PACKING, OrderStatus.CANCELLED},
        OrderStatus.PACKING: {OrderStatus.SHIPPED},
        OrderStatus.SHIPPED: {OrderStatus.DELIVERED_PENDING_CONFIRM},
        OrderStatus.DELIVERED_PENDING_CONFIRM: {OrderStatus.DELIVERED},
    }

    _BUYER_TRANSITIONS = {
        OrderStatus.SHIPPED: {OrderStatus.DELIVERED},
        OrderStatus.DELIVERED_PENDING_CONFIRM: {OrderStatus.DELIVERED},
    }

    def update_order_status(
        self,
        order_id: int,
        new_status: OrderStatus,
        changed_by_user_id: int,
        note: Optional[str] = None,
        is_seller: bool = False,
        is_buyer: bool = False,
    ) -> Order:
        order = self.get_order(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        allowed: set = set()
        if is_seller:
            allowed |= self._SELLER_TRANSITIONS.get(order.status, set())
        if is_buyer:
            allowed |= self._BUYER_TRANSITIONS.get(order.status, set())

        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot move order from '{order.status}' to '{new_status}' with your current role.",
            )

        order.status = new_status
        self.db.add(OrderStatusHistory(order_id=order.id, status=new_status, note=note, changed_by_user_id=changed_by_user_id))
        self.db.commit()
        self.db.refresh(order)
        return order
