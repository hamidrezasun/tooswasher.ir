from pydantic import BaseModel
from typing import Optional

class DiscountBase(BaseModel):
    code: Optional[str] = None
    percent: float
    max_discount: Optional[float] = None  # Add max_discount field
    product_id: Optional[int] = None
    customer_id: Optional[int] = None

class DiscountCreate(DiscountBase):
    pass

class DiscountUpdate(BaseModel):
    code: Optional[str] = None
    percent: Optional[float] = None
    max_discount: Optional[float] = None  # Add max_discount field
    product_id: Optional[int] = None
    customer_id: Optional[int] = None

class Discount(DiscountBase):
    id: int

    class Config:
        from_attributes = True