from sqlalchemy.orm import Session
from models.cart import Cart
import schemas.cart as cart_schemas
from crud.product import get_product

def create_cart_item(db: Session, cart: cart_schemas.CartCreate, user_id: int):
    # Check if product exists and has enough stock
    product = get_product(db, cart.product_id)
    if not product:
        raise ValueError("Product not found")
    if product.stock < cart.quantity:
        raise ValueError("Not enough stock available")
    
    # Check if item already exists in cart
    existing_item = db.query(Cart).filter(
        Cart.user_id == user_id,
        Cart.product_id == cart.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += cart.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item
    
    db_cart = Cart(**cart.dict(), user_id=user_id)
    db.add(db_cart)
    db.commit()
    db.refresh(db_cart)
    return db_cart

def get_cart_items(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(Cart).filter(Cart.user_id == user_id).offset(skip).limit(limit).all()

def get_cart_item(db: Session, cart_id: int, user_id: int):
    return db.query(Cart).filter(Cart.id == cart_id, Cart.user_id == user_id).first()

def update_cart_item(db: Session, cart_id: int, user_id: int, quantity: int):
    cart_item = get_cart_item(db, cart_id, user_id)
    if not cart_item:
        raise ValueError("Cart item not found")
    
    product = get_product(db, cart_item.product_id)
    if product.stock < quantity:
        raise ValueError("Not enough stock available")
    
    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item

def delete_cart_item(db: Session, cart_id: int, user_id: int):
    cart_item = get_cart_item(db, cart_id, user_id)
    if not cart_item:
        raise ValueError("Cart item not found")
    
    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed from cart"}