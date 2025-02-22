# models/discount.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=True)  # Unique discount code
    percent = Column(Float)  # Discount percentage (e.g., 10.5 for 10.5%)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # Optional link to specific product
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Optional link to specific customer
    
    product = relationship("Product")  # Relationship to Product
    customer = relationship("User")  # Relationship to Customer (assuming Customer model exists)