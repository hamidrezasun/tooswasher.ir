from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class DiscountStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    USED = "used"
    DISABLED = "disabled"

class DiscountBase(BaseModel):
    code: Optional[str] = None
    percent: float
    max_discount: Optional[float] = None
    product_id: Optional[int] = None
    customer_id: Optional[int] = None
    submitted_by_user_id: int  # Added (required on creation)
    status: Optional[DiscountStatus] = DiscountStatus.ACTIVE  # Optional with default

class DiscountCreate(DiscountBase):
    pass

class DiscountUpdate(BaseModel):
    code: Optional[str] = None
    percent: Optional[float] = None
    max_discount: Optional[float] = None
    product_id: Optional[int] = None
    customer_id: Optional[int] = None
    status: Optional[DiscountStatus] = None  # Allow status updates

class Discount(DiscountBase):
    id: int
    submission_date: datetime  # Added

    class Config:
        from_attributes = True