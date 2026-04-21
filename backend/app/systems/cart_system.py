from decimal import Decimal
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.cart import CartItem
from app.models.product import Product, ProductStatus


class CartSystem:

    def __init__(self, db: Session):
        self.db = db


    def _load_purchasable_product(self, product_id: int, quantity: int) -> Product:
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Product not found')
        try:
            product.assert_purchasable(quantity)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        return product

    def _cart_query(self, user_id: int):
        return (
            self.db.query(CartItem)
            .options(joinedload(CartItem.product))
            .filter(CartItem.user_id == user_id)
        )


    def get_cart(self, user_id: int) -> dict:
        items: List[CartItem] = (
            self._cart_query(user_id).order_by(CartItem.created_at).all()
        )
        total_items = sum(i.quantity for i in items)
        total_amount = sum(i.subtotal() for i in items)
        return {
            'items': [self._to_response(i) for i in items],
            'total_items': total_items,
            'total_amount': total_amount,
        }

    def add_item(self, user_id: int, product_id: int, quantity: int) -> dict:
        self._load_purchasable_product(product_id, quantity)
        existing = (
            self.db.query(CartItem)
            .filter(CartItem.user_id == user_id, CartItem.product_id == product_id)
            .first()
        )
        if existing:
            new_qty = existing.quantity + quantity
            self._load_purchasable_product(product_id, new_qty)
            existing.merge_quantity(quantity)
        else:
            existing = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
            self.db.add(existing)
        self.db.commit()
        return self.get_cart(user_id)

    def update_item(self, user_id: int, item_id: int, quantity: int) -> dict:
        item = (
            self.db.query(CartItem)
            .filter(CartItem.id == item_id, CartItem.user_id == user_id)
            .first()
        )
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Cart item not found')
        self._load_purchasable_product(item.product_id, quantity)
        try:
            item.set_quantity(quantity)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        self.db.commit()
        return self.get_cart(user_id)

    def remove_item(self, user_id: int, item_id: int) -> dict:
        item = (
            self.db.query(CartItem)
            .filter(CartItem.id == item_id, CartItem.user_id == user_id)
            .first()
        )
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Cart item not found')
        self.db.delete(item)
        self.db.commit()
        return self.get_cart(user_id)

    def clear_cart(self, user_id: int) -> dict:
        self.db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        self.db.commit()
        return {'items': [], 'total_items': 0, 'total_amount': Decimal('0')}


    @staticmethod
    def _to_response(item: CartItem) -> dict:
        p = item.product
        first_image = p.images[0].image_url if p.images else None
        return {
            'id': item.id,
            'product_id': item.product_id,
            'quantity': item.quantity,
            'product': {
                'id': p.id,
                'title': p.title,
                'price': p.price,
                'stock': p.stock,
                'status': p.status.value,
                'store_id': p.store_id,
                'image_url': first_image,
            },
            'created_at': item.created_at,
            'updated_at': item.updated_at,
        }
