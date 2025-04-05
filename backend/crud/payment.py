from sqlalchemy.orm import Session
from models.payment import Payment
from schemas.payment import PaymentCreate, PaymentRead, PaymentUpdate

def create_payment(db: Session, payment: PaymentCreate):
    db_payment = Payment(**payment.dict())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def get_payments(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Payment).offset(skip).limit(limit).all()

def get_payment(db: Session, payment_id: int):
    return db.query(Payment).filter(Payment.id == payment_id).first()

def update_payment(db: Session, payment_id: int, payment: PaymentUpdate):
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if db_payment is None:
        return None
    for var, value in vars(payment).items():
        setattr(db_payment, var, value) if value else None
    db.commit()
    db.refresh(db_payment)
    return db_payment

def delete_payment(db: Session, payment_id: int):
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if db_payment is None:
        return None
    db.delete(db_payment)
    db.commit()
    return db_payment
