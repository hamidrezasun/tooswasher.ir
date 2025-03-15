from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=True)  # Added length
    percent = Column(Float)  # Discount percentage (e.g., 10.5 for 10.5%)
    max_discount = Column(Float, nullable=True)  # Maximum discount amount (e.g., 50.0 for $50)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # Optional link to specific product
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Optional link to specific customer
    
    product = relationship("Product")  # Relationship to Product
    customer = relationship("User")  # Relationship to Customer (assuming Customer model exists)