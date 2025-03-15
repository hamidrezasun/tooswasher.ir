# schemas/category.py
from pydantic import BaseModel
from typing import Optional, List

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    description: str
    parent_id: Optional[int] = None  # Optional field for parent category ID

class Category(CategoryBase):
    id: int
    description: str
    parent_id: Optional[int] = None  # Optional field for parent category ID
    subcategories: List["Category"] = []  # List of subcategories

    class Config:
        from_attributes = True  # Enables ORM mode for Pydantic

# This is necessary to support recursive models (categories with subcategories)
