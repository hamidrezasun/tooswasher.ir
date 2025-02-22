# schemas/order.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrderItem(BaseModel):
    product_id: int
    quantity: int
    discount_id: Optional[int] = None  # Add discount_id to the schema
    discounted_price: Optional[float] = None

class OrderBase(BaseModel):
    status: Optional[str] = "Pending"
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    discount_code: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItem]

class OrderUpdate(OrderBase):
    status: Optional[str] = None
    discount_code: Optional[str] = None

class Order(OrderBase):
    id: int
    user_id: int
    total_amount: float  # Included in response only
    created_at: datetime
    items: List[OrderItem] = []

    class Config:
        from_attributes = True