from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
from enum import Enum as PyEnum

class DiscountStatus(PyEnum):
    ACTIVE = "active"
    EXPIRED = "expired"
    USED = "used"
    DISABLED = "disabled"

class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=True)
    percent = Column(Float)
    max_discount = Column(Float, nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    submitted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Renamed to avoid conflict
    submission_date = Column(DateTime, default=func.now())
    status = Column(String(20), default=DiscountStatus.ACTIVE.value)
    
    # Relationships
    product = relationship("Product")
    customer = relationship("User", foreign_keys=[customer_id])
    submitter = relationship("User", foreign_keys=[submitted_by_user_id])  # Renamed to 'submitter'