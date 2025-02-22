# schemas/page.py
from pydantic import BaseModel
from typing import Optional

class PageBase(BaseModel):
    name: str
    body: str

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    name: Optional[str] = None
    body: Optional[str] = None

class Page(PageBase):
    id: int

    class Config:
        from_attributes = True