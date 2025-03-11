from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud.cart as cart_crud
import schemas.cart as cart_schemas
import schemas.user as user_schemas
import auth
from database import get_db

router = APIRouter(
    prefix="/cart",
    tags=["cart"]
)

@router.post("/", response_model=cart_schemas.Cart)
def add_to_cart(
    cart: cart_schemas.CartCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        return cart_crud.create_cart_item(db=db, cart=cart, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[cart_schemas.Cart])
def read_cart(
    skip: int = 0,
    limit: int = 100,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return cart_crud.get_cart_items(db=db, user_id=current_user.id, skip=skip, limit=limit)

@router.put("/{cart_id}", response_model=cart_schemas.Cart)
def update_cart(
    cart_id: int,
    quantity: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        return cart_crud.update_cart_item(db=db, cart_id=cart_id, user_id=current_user.id, quantity=quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{cart_id}")
def delete_from_cart(
    cart_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        return cart_crud.delete_cart_item(db=db, cart_id=cart_id, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))