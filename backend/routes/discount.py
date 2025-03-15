# routes/discount.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.discount import Discount, DiscountCreate, DiscountUpdate
import schemas.user as user_schemas
from crud.discount import get_discount, get_discount_by_code, get_discounts, create_discount, update_discount, delete_discount
import auth  # Import your auth module

router = APIRouter(
    prefix="/discounts",
    tags=["discounts"]
)

# Create discount - Admin only
@router.post("/", response_model=Discount)
def create_new_discount(
    discount: DiscountCreate,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)  # Admin check
):
    existing_discount = get_discount_by_code(db, discount.code)
    if existing_discount:
        raise HTTPException(status_code=400, detail="Discount code already exists")
    return create_discount(db=db, discount=discount)

# Get all discounts - Any authenticated user can view
@router.get("/", response_model=List[Discount])
def read_discounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)  # Regular user can view
):
    discounts = get_discounts(db=db, skip=skip, limit=limit)
    return discounts

# Get specific discount by ID - Any authenticated user can view
@router.get("/{discount_id}", response_model=Discount)
def read_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    discount = get_discount(db=db, discount_id=discount_id)
    if discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    return discount

# Get discount by code - Any authenticated user can view
@router.get("/code/{code}", response_model=Discount)
def read_discount_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_user)
):
    discount = get_discount_by_code(db=db, code=code)
    if discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    return discount

# Update discount - Admin only
@router.put("/{discount_id}", response_model=Discount)
def update_existing_discount(
    discount_id: int,
    discount: DiscountUpdate,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)  # Admin check
):
    if discount.code:
        existing_discount = get_discount_by_code(db, discount.code)
        if existing_discount and existing_discount.id != discount_id:
            raise HTTPException(status_code=400, detail="Discount code already exists")
    
    updated_discount = update_discount(db=db, discount_id=discount_id, discount=discount)
    if updated_discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    return updated_discount

# Delete discount - Admin only
@router.delete("/{discount_id}", response_model=Discount)
def delete_existing_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)  # Admin check
):
    deleted_discount = delete_discount(db=db, discount_id=discount_id)
    if deleted_discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    return deleted_discount