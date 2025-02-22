# models/product.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    stock = Column(Integer)
    owner_id = Column(Integer, ForeignKey("users.id"))
    image = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category")  # Define relationship here