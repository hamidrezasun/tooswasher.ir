from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.payment import PaymentCreate, PaymentRead, PaymentUpdate
from crud import payment
from typing import List

router = APIRouter(
    prefix="/payments",
    tags=["payments"]
)

@router.post("/payments/", response_model=PaymentRead)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    return payment_crud.create_payment(db, payment)

@router.get("/payments/", response_model=List[PaymentRead])
def read_payments(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    payments = payment_crud.get_payments(db, skip=skip, limit=limit)
    return payments

@router.get("/payments/{payment_id}", response_model=PaymentRead)
def read_payment(payment_id: int, db: Session = Depends(get_db)):
    db_payment = payment_crud.get_payment(db, payment_id)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment

@router.put("/payments/{payment_id}", response_model=PaymentRead)
def update_payment(payment_id: int, payment: PaymentUpdate, db: Session = Depends(get_db)):
    db_payment = payment_crud.update_payment(db, payment_id, payment)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment

@router.delete("/payments/{payment_id}", response_model=PaymentRead)
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    db_payment = payment_crud.delete_payment(db, payment_id)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment
