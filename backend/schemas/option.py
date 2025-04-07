from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OptionBase(BaseModel):
    option_name: str
    option_value: str


class OptionCreate(OptionBase):
    pass


class OptionUpdate(OptionBase):
    option_name: Optional[str] = None
    option_value: Optional[str] = None



class Option(OptionBase):
    option_id: int

    class Config:
        from_attributes = True
