# schemas/page.py
from pydantic import BaseModel
from typing import Optional

class PageBase(BaseModel):
    name: str
    body: str
    is_in_menu: bool = False  # Added with default False

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    name: Optional[str] = None
    body: Optional[str] = None
    is_in_menu: Optional[bool] = None  # Optional for updates

class Page(PageBase):
    id: int

    class Config:
        from_attributes = True  # Updated from orm_mode to from_attributes (Pydantic v2)