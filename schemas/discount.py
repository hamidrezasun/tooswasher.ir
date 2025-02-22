# schemas/discount.py
from pydantic import BaseModel
from typing import Optional

class DiscountBase(BaseModel):
    code: Optional[str] = None
    percent: float
    product_id: Optional[int] = None
    customer_id: Optional[int] = None

class DiscountCreate(DiscountBase):
    pass

class DiscountUpdate(DiscountBase):
    code: Optional[str] = None
    percent: Optional[float] = None

class Discount(DiscountBase):
    id: int

    class Config:
        orm_mode = True