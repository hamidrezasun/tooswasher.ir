from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import crud.order as order_crud
import schemas.order as order_schemas
import schemas.user as user_schemas
import auth
from database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

@router.post("/", response_model=order_schemas.Order, status_code=status.HTTP_201_CREATED)
def create_order(
    order: order_schemas.OrderCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new order for the authenticated user."""
    try:
        return order_crud.create_order(db, order=order, user_id=current_user.id)
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[order_schemas.Order])
def read_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get list of orders for the authenticated user.
    Supports pagination and filtering by status and date range.
    """
    orders = order_crud.get_orders(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
        start_date=start_date,
        end_date=end_date
    )
    return orders

@router.get("/all", response_model=List[order_schemas.Order])
def read_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get list of all orders (admin only).
    Supports pagination and filtering by status and date range.
    """
    orders = order_crud.get_orders(
        db,
        user_id=None,  # No user filter for admins
        skip=skip,
        limit=limit,
        status=status,
        start_date=start_date,
        end_date=end_date
    )
    return orders

@router.get("/{order_id}", response_model=order_schemas.Order)
def read_order(
    order_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get order details for the authenticated user.
    """
    order = order_crud.get_order(db, order_id=order_id, user_id=current_user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or you don't have permission to access it")
    return order

@router.put("/{order_id}", response_model=order_schemas.Order)
def update_order(
    order_id: int,
    order_update: order_schemas.OrderUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update an order (admin only)."""
    try:
        updated_order = order_crud.update_order(db, order_id=order_id, order=order_update)
        if not updated_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return updated_order
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete an order (admin only)."""
    deleted_order = order_crud.delete_order(db, order_id=order_id)
    if not deleted_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return None