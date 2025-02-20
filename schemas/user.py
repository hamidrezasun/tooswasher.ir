from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: Optional[bool] = True
    role: Optional[str] = "customer"

    class Config:
        from_attributes = True