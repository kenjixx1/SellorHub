from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartResponse
from app.services.cart_service import CartService
router = APIRouter(prefix='/api/cart', tags=['Cart'])

@router.get('', response_model=CartResponse, summary='Get my cart', description="Returns the current user's cart with all items, quantities, and totals.")
def get_cart(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    return CartService(db).get_cart(current_user.id)

@router.post('/items', response_model=CartResponse, status_code=status.HTTP_201_CREATED, summary='Add item to cart', description='Add a product to the cart or increase quantity if already present.')
def add_to_cart(data: CartItemAdd, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    return CartService(db).add_item(current_user.id, data.product_id, data.quantity)

@router.put('/items/{item_id}', response_model=CartResponse, summary='Update cart item quantity', description='Set the quantity for a specific cart item.')
def update_cart_item(item_id: int, data: CartItemUpdate, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    return CartService(db).update_item(current_user.id, item_id, data.quantity)

@router.delete('/items/{item_id}', response_model=CartResponse, summary='Remove cart item', description='Remove a specific item from the cart.')
def remove_cart_item(item_id: int, current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    return CartService(db).remove_item(current_user.id, item_id)

@router.delete('', response_model=CartResponse, summary='Clear cart', description='Remove all items from the cart.')
def clear_cart(current_user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    return CartService(db).clear_cart(current_user.id)