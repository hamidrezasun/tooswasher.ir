# schemas/product.py
from pydantic import BaseModel
from typing import Optional, Dict
from schemas.category import Category  # Assuming this exists

class DiscountInfo(BaseModel):
    id: int
    code: str
    percent: float
    max_discount: Optional[float] = None

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    image: Optional[str] = None
    category_id: int
    minimum_order: Optional[int] = 1
    rate: Optional[float] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image: Optional[str] = None
    category_id: Optional[int] = None
    minimum_order: Optional[int] = None
    rate: Optional[float] = None

class Product(ProductBase):
    id: int
    owner_id: int
    category: Category
    discount: Optional[DiscountInfo] = None  # Populated for logged-in users

    class Config:
        from_attributes = True  