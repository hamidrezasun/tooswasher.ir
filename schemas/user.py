from pydantic import BaseModel
from typing import Optional
from enum import Enum

class RoleEnum(str, Enum):
    customer = "customer"
    admin = "admin"

class UserBase(BaseModel):
    username: str
    email: str
    national_id: str
    address: str
    state: str
    city: str
    phone_number: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    role: RoleEnum

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[RoleEnum] = None

class UserRoleUpdate(BaseModel):
    role: RoleEnum

class ResetPasswordRequest(BaseModel):
    email: str

class ResetPassword(BaseModel):
    reset_token: str
    new_password: str

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class MessageResponse(BaseModel):
    message: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    phone_number: Optional[str] = None

class MessageResponse(BaseModel):
    message: str