# crud/discount.py
from sqlalchemy.orm import Session
from models.discount import Discount
from schemas.discount import DiscountCreate, DiscountUpdate

def get_discount(db: Session, discount_id: int):
    return db.query(Discount).filter(Discount.id == discount_id).first()

def get_discount_by_code(db: Session, code: str):
    return db.query(Discount).filter(Discount.code == code).first()

def get_discounts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Discount).offset(skip).limit(limit).all()

def create_discount(db: Session, discount: DiscountCreate):
    db_discount = Discount(**discount.dict())
    db.add(db_discount)
    db.commit()
    db.refresh(db_discount)
    return db_discount

def update_discount(db: Session, discount_id: int, discount: DiscountUpdate):
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
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if db_discount:
        db.delete(db_discount)
        db.commit()
        return db_discount
    return None