"""
OrderSystem - application-layer orchestration for checkout and order management.
Delegates status transition rules to the Order entity, and product
availability/stock rules to the Product entity.
"""
import uuid
from decimal import Decimal
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.address import Address
from app.models.cart import CartItem
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.order_status_history import OrderStatusHistory
from app.models.product import Product, ProductStatus
from app.models.store import Store
from app.schemas.order import OrderCreate


class OrderSystem:
    """
    Orchestrates checkout (cart and direct), order queries, and status updates.
    Business rules for status transitions live on Order; product rules live on Product.
    """

    def __init__(self, db: Session):
        self.db = db

    # ── checkout ──────────────────────────────────────────────────────────────

    def create_order_from_cart(
        self, buyer_id: int, store_id: int, shipping_address_id: int
    ) -> Order:
        """Create an order from the buyer's cart items for a single store."""
        address = (
            self.db.query(Address)
            .filter(Address.id == shipping_address_id, Address.user_id == buyer_id)
            .first()
        )
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail='Shipping address not found'
            )

        store = self.db.query(Store).filter(Store.id == store_id).first()
        if not store:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Store not found')

        cart_items: List[CartItem] = (
            self.db.query(CartItem)
            .join(Product)
            .filter(CartItem.user_id == buyer_id, Product.store_id == store_id)
            .all()
        )
        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='No cart items for this store',
            )

        order_items, total = self._build_order_items(cart_items_or_specs=cart_items)

        order = Order(
            order_number=f'ORD-{uuid.uuid4().hex[:10].upper()}',
            buyer_id=buyer_id,
            store_id=store_id,
            status=OrderStatus.PLACED,
            total_amount=total,
            currency='THB',
            shipping_address_id=shipping_address_id,
            items=order_items,
        )
        self.db.add(order)
        self.db.add(OrderStatusHistory(
            order=order,
            status=OrderStatus.PLACED,
            note='Order placed',
            changed_by_user_id=buyer_id,
        ))

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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail='Shipping address not found'
            )

        store = self.db.query(Store).filter(Store.id == data.store_id).first()
        if not store:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Store not found')

        order_items, total = self._build_order_items(
            explicit_specs=[(item.product_id, item.quantity, data.store_id) for item in data.items]
        )

        order = Order(
            order_number=f'ORD-{uuid.uuid4().hex[:10].upper()}',
            buyer_id=buyer_id,
            store_id=data.store_id,
            status=OrderStatus.PLACED,
            total_amount=total,
            currency='THB',
            shipping_address_id=data.shipping_address_id,
            items=order_items,
        )
        self.db.add(order)
        self.db.add(OrderStatusHistory(
            order=order,
            status=OrderStatus.PLACED,
            note='Order placed',
            changed_by_user_id=buyer_id,
        ))
        self.db.commit()
        self.db.refresh(order)
        return order

    # ── queries ───────────────────────────────────────────────────────────────

    def get_order(self, order_id: int) -> Optional[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.id == order_id)
            .first()
        )

    def list_buyer_orders(
        self, buyer_id: int, skip: int = 0, limit: int = 20
    ) -> Tuple[List[Order], int]:
        q = self.db.query(Order).filter(Order.buyer_id == buyer_id)
        total = q.count()
        orders = (
            q.options(joinedload(Order.items))
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return orders, total

    def list_store_orders(
        self,
        store_id: int,
        skip: int = 0,
        limit: int = 20,
        status_filter: Optional[OrderStatus] = None,
    ) -> Tuple[List[Order], int]:
        q = self.db.query(Order).filter(Order.store_id == store_id)
        if status_filter:
            q = q.filter(Order.status == status_filter)
        total = q.count()
        orders = (
            q.options(joinedload(Order.items))
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return orders, total

    # ── status updates ────────────────────────────────────────────────────────

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
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Order not found')
        try:
            order.apply_transition(new_status, is_seller=is_seller, is_buyer=is_buyer)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        self.db.add(OrderStatusHistory(
            order_id=order.id,
            status=new_status,
            note=note,
            changed_by_user_id=changed_by_user_id,
        ))
        self.db.commit()
        self.db.refresh(order)
        return order

    # ── internal helpers ──────────────────────────────────────────────────────

    def _build_order_items(
        self,
        cart_items_or_specs: Optional[List[CartItem]] = None,
        explicit_specs: Optional[List[tuple]] = None,
    ) -> Tuple[List[OrderItem], Decimal]:
        """
        Validate products, build OrderItem rows, and decrement stock.
        Accepts either CartItem rows or (product_id, quantity, store_id) tuples.
        Returns (order_items, total).
        """
        order_items: List[OrderItem] = []
        total = Decimal('0')

        if cart_items_or_specs:
            for ci in cart_items_or_specs:
                product = ci.product
                try:
                    product.assert_purchasable(ci.quantity)
                except ValueError as exc:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
                total += product.line_total(ci.quantity)
                order_items.append(OrderItem(
                    product_id=product.id,
                    product_title_snapshot=product.title,
                    unit_price_snapshot=product.price,
                    quantity=ci.quantity,
                ))
                product.reserve_stock(ci.quantity)

        if explicit_specs:
            for product_id, quantity, store_id in explicit_specs:
                product = self.db.query(Product).filter(Product.id == product_id).first()
                if not product or product.store_id != store_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f'Product {product_id} not found in store',
                    )
                try:
                    product.assert_purchasable(quantity)
                except ValueError as exc:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
                total += product.line_total(quantity)
                order_items.append(OrderItem(
                    product_id=product.id,
                    product_title_snapshot=product.title,
                    unit_price_snapshot=product.price,
                    quantity=quantity,
                ))
                product.reserve_stock(quantity)

        return order_items, total
