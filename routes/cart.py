from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.auth import get_current_user, get_db
from models.user import User
from models.cart import Cart
from models.product import Product
from schemas.cart import CartCreate, Cart

cart_router = APIRouter()

@cart_router.post("/", response_model=Cart)
def add_to_cart(
    cart: CartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == cart.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing_cart_item = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.product_id == cart.product_id
    ).first()

    if existing_cart_item:
        existing_cart_item.quantity += cart.quantity
    else:
        db_cart = Cart(
            user_id=current_user.id,
            product_id=cart.product_id,
            quantity=cart.quantity
        )
        db.add(db_cart)

    db.commit()
    db.refresh(existing_cart_item if existing_cart_item else db_cart)
    return existing_cart_item if existing_cart_item else db_cart

@cart_router.get("/", response_model=list[Cart])
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    return cart_items

@cart_router.delete("/{cart_item_id}")
def remove_from_cart(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart_item = db.query(Cart).filter(
        Cart.id == cart_item_id,
        Cart.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}