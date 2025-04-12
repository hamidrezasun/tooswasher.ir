from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    discount_id: Optional[int] = None
    discounted_price: Optional[float] = None

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    status: str = "Pending"
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None

class OrderCreate(OrderBase):
    user_id: int
    items: List[OrderItemCreate]

class OrderUpdate(OrderBase):
    status: Optional[str] = None

class Order(OrderBase):
    id: int
    user_id: int
    total_amount: float
    created_at: datetime
    items: List[OrderItem] = []

    class Config:
        from_attributes = True