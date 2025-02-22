# schemas/product.py
from pydantic import BaseModel
from typing import Optional
from schemas.category import Category

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    image: Optional[str] = None
    category_id: int  # Now references a Category ID

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None  # Making all fields optional for partial updates
    price: Optional[float] = None
    stock: Optional[int] = None
    category_id: Optional[int] = None

class Product(ProductBase):
    id: int
    owner_id: int
    category: Category  # Expects the full Category object

    class Config:
        orm_mode = True