from pydantic import BaseModel
from typing import Optional, Dict
from schemas.category import Category

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

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category_id: Optional[int] = None

class Product(ProductBase):
    id: int
    owner_id: int
    category: Category
    discount: Optional[DiscountInfo] = None  # Include discount information

    class Config:
        from_attributes = True