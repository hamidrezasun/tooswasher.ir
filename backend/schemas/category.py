# schemas/category.py
from pydantic import BaseModel, HttpUrl
from typing import Optional, List

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    description: str
    parent_id: Optional[int] = None
    image_url: Optional[HttpUrl] = None  # Using HttpUrl for URL validation

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    image_url: Optional[HttpUrl] = None

class Category(CategoryBase):
    id: int
    description: str
    parent_id: Optional[int] = None
    image_url: Optional[HttpUrl] = None
    subcategories: List["Category"] = []

    class Config:
        from_attributes = True

Category.model_rebuild()