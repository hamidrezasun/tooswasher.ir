from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)  # Added length
    description = Column(String(500))  # Added length
    price = Column(Float)
    stock = Column(Integer)
    owner_id = Column(Integer, ForeignKey("users.id"))
    image = Column(String(255))  # Added length
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category")  # Define relationship here
    minimum_order = Column(Integer, default=1)  # Added minimum order with default value of 1
    rate = Column(Float, nullable=True)  # Added rate, allowing null values
    