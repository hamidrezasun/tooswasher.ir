from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models.payment import PaymentMethod

class PaymentCreate(BaseModel):
    payment_date: Optional[datetime] = None
    order_id: int
    payment_method: PaymentMethod

class PaymentRead(BaseModel):
    id: int
    payment_date: datetime
    order_id: int
    payment_method: PaymentMethod

class PaymentUpdate(BaseModel):
    payment_date: Optional[datetime] = None
    order_id: Optional[int] = None
    payment_method: Optional[PaymentMethod] = None

    class Config:
        rom_attributes = True 
