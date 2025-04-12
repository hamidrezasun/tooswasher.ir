from sqlalchemy.orm import Session
from models.discount import Discount, DiscountStatus
from schemas.discount import DiscountCreate, DiscountUpdate
from typing import Optional, Dict  # Added for Python 3.9 compatibility
from datetime import datetime

def get_discount(db: Session, discount_id: int):
    """Retrieve a discount by its ID."""
    return db.query(Discount).filter(Discount.id == discount_id).first()

def get_discount_by_code(db: Session, code: str):
    """Retrieve a discount by its code."""
    return db.query(Discount).filter(Discount.code == code).first()

def get_discounts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: DiscountStatus = None,
    submitted_by_user_id: int = None
):
    """Retrieve a filtered list of discounts with pagination."""
    query = db.query(Discount)
    
    # Apply filters if provided
    if status:
        query = query.filter(Discount.status == status)
    if submitted_by_user_id:
        query = query.filter(Discount.submitted_by_user_id == submitted_by_user_id)
    
    return query.offset(skip).limit(limit).all()

def create_discount(db: Session, discount: DiscountCreate):
    """Create a new discount."""
    db_discount = Discount(
        code=discount.code,
        percent=discount.percent,
        max_discount=discount.max_discount,
        product_id=discount.product_id,
        customer_id=discount.customer_id,
        submitted_by_user_id=discount.submitted_by_user_id,
        status=discount.status or DiscountStatus.ACTIVE.value,  # Default to "active"
        submission_date=datetime.utcnow()  # Explicitly set (optional, since default is in model)
    )
    db.add(db_discount)
    db.commit()
    db.refresh(db_discount)
    return db_discount

def update_discount(db: Session, discount_id: int, discount: DiscountUpdate):
    """Update an existing discount."""
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if db_discount:
        update_data = discount.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_discount, key, value)
        db.commit()
        db.refresh(db_discount)
        return db_discount
    return None

def delete_discount(db: Session, discount_id: int):
    """Delete a discount by its ID."""
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if db_discount:
        db.delete(db_discount)
        db.commit()
        return db_discount
    return None

def get_applicable_discount(db: Session, product_id: int, user_id: int = None) -> Optional[Dict]:
    """
    Find the most specific applicable ACTIVE discount for a product.
    Returns discount details as a dictionary or None if no active discount is found.
    
    Args:
        db: SQLAlchemy database session
        product_id: ID of the product to check discounts for
        user_id: Optional user ID to check for user-specific discounts
    
    Returns:
        Dictionary containing discount details or None
    """
    # Base query for active discounts
    base_query = db.query(Discount).filter(
        Discount.status == DiscountStatus.ACTIVE.value
    )

    if user_id:
        # 1. Check user-specific discount for this product
        discount = base_query.filter(
            Discount.customer_id == user_id,
            Discount.product_id == product_id
        ).first()
        if discount:
            return {
                "id": discount.id,
                "code": discount.code,
                "percent": discount.percent,
                "max_discount": discount.max_discount,
                "status": discount.status
            }
        
        # 2. Check user-specific general discount (no product_id)
        discount = base_query.filter(
            Discount.customer_id == user_id,
            Discount.product_id.is_(None)
        ).first()
        if discount:
            return {
                "id": discount.id,
                "code": discount.code,
                "percent": discount.percent,
                "max_discount": discount.max_discount,
                "status": discount.status
            }

    # 3. Check product-specific discount
    discount = base_query.filter(
        Discount.product_id == product_id,
        Discount.customer_id.is_(None)
    ).first()
    if discount:
        return {
            "id": discount.id,
            "code": discount.code,
            "percent": discount.percent,
            "max_discount": discount.max_discount,
            "status": discount.status
        }

    # 4. Check general discount (no product_id and no customer_id)
    discount = base_query.filter(
        Discount.product_id.is_(None),
        Discount.customer_id.is_(None)
    ).first()
    if discount:
        return {
            "id": discount.id,
            "code": discount.code,
            "percent": discount.percent,
            "max_discount": discount.max_discount,
            "status": discount.status
        }

    return None