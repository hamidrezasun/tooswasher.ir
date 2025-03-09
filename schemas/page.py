# schemas/page.py
from pydantic import BaseModel
from typing import Optional

class PageBase(BaseModel):
    id: int
    name: str
    is_in_menu: Optional[bool] = False

    class Config:
        from_attributes = True  # Enables compatibility with SQLAlchemy ORM objects

class PageCreate(PageBase):
    """Schema for creating a new page"""
    body: Optional[str] = None
    id: Optional[int] = None  # Override id to make it optional for creation

class PageUpdate(BaseModel):
    """Schema for updating an existing page - all fields optional"""
    name: Optional[str] = None
    body: Optional[str] = None
    is_in_menu: Optional[bool] = None

    class Config:
        from_attributes = True

class Page(PageBase):
    """Schema for returning a page with body"""
    body: Optional[str] = None

    class Config:
        from_attributes = True