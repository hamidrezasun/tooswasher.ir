# routes/order.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud.order as order_crud
import schemas.order as order_schemas
import schemas.user as user_schemas
import auth
from database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

@router.post("/", response_model=order_schemas.Order)
def create_order(
    order: order_schemas.OrderCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return order_crud.create_order(db=db, order=order, user_id=current_user.id)

@router.get("/", response_model=List[order_schemas.Order])
def read_orders(
    skip: int = 0,
    limit: int = 100,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    orders = order_crud.get_orders(db, skip=skip, limit=limit)
    if current_user.role != "admin":
        orders = [order for order in orders if order.user_id == current_user.id]
    return orders

@router.get("/{order_id}", response_model=order_schemas.Order)
def read_order(
    order_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    order = order_crud.get_order(db, order_id=order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
    return order

@router.put("/{order_id}", response_model=order_schemas.Order)
def update_order(
    order_id: int,
    order: order_schemas.OrderUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_order = order_crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if db_order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this order")
    updated_order = order_crud.update_order(db, order_id=order_id, order=order)
    return updated_order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_order = order_crud.get_order(db, order_id=order_id)
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if db_order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this order")
    order_crud.delete_order(db, order_id=order_id)
    return None