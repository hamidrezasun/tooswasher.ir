from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
from schemas.discount import Discount, DiscountCreate, DiscountUpdate, DiscountStatus
import schemas.user as user_schemas
from crud.discount import (
    get_discount, 
    get_discount_by_code, 
    get_discounts, 
    create_discount, 
    update_discount, 
    delete_discount
)
import auth

router = APIRouter(
    prefix="/discounts",
    tags=["discounts"]
)

# Create discount - Admin only
@router.post("/", response_model=Discount)
def create_new_discount(
    discount: DiscountCreate,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    # Auto-set submitted_by_user_id to current admin
    discount.submitted_by_user_id = current_user.id
    
    if discount.code:
        existing_discount = get_discount_by_code(db, discount.code)
        if existing_discount:
            raise HTTPException(status_code=400, detail="Discount code already exists")
    
    return create_discount(db=db, discount=discount)

# Get all discounts with filters
@router.get("/", response_model=List[Discount])
def read_discounts(
    skip: int = 0,
    limit: int = 100,
    status: Optional[DiscountStatus] = Query(None),
    submitted_by_user_id: Optional[int] = Query(None),
    code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_user)
):
    """
    Get discounts with optional filters:
    - status: active/expired/used/disabled
    - submitted_by_user_id: Filter by creator
    - code: Search by discount code
    """
    discounts = get_discounts(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        submitted_by_user_id=submitted_by_user_id
    )
    
    if code:
        discounts = [d for d in discounts if d.code and code.lower() in d.code.lower()]
    
    return discounts

# Get discount by ID
@router.get("/{discount_id}", response_model=Discount)
def read_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_user)
):
    discount = get_discount(db=db, discount_id=discount_id)
    if discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    return discount

# Get discount by code
@router.get("/code/{code}", response_model=Discount)
def read_discount_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_user)
):
    discount = get_discount_by_code(db=db, code=code)
    if discount is None:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    # Check if discount is usable
    if discount.status != DiscountStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail=f"Discount is {discount.status}"
        )
    
    return discount

# Update discount - Admin only
@router.put("/{discount_id}", response_model=Discount)
def update_existing_discount(
    discount_id: int,
    discount: DiscountUpdate,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    db_discount = get_discount(db=db, discount_id=discount_id)
    if not db_discount:
        raise HTTPException(status_code=404, detail="Discount not found")

    if discount.code and discount.code != db_discount.code:
        existing = get_discount_by_code(db, discount.code)
        if existing:
            raise HTTPException(status_code=400, detail="Discount code already exists")

    return update_discount(db=db, discount_id=discount_id, discount=discount)

# Delete discount - Admin only
@router.delete("/{discount_id}", response_model=Discount)
def delete_existing_discount(
    discount_id: int,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    discount = delete_discount(db=db, discount_id=discount_id)
    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    return discount