# schemas/user.py
from pydantic import BaseModel
from typing import Optional, List
from pydantic import ConfigDict
from enum import Enum

class RoleEnum(str, Enum):
    customer = "customer"
    admin = "admin"
    staff = "staff"

class UserBase(BaseModel):
    id: int
    username: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None  # Added name
    last_name: Optional[str] = None  # Added last_name

    model_config = ConfigDict(from_attributes=True)

class User(UserBase):
    is_active: Optional[bool] = True
    role: RoleEnum
    national_id: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    phone_number: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    name: Optional[str] = None  # Added name
    last_name: Optional[str] = None  # Added last_name
    national_id: str
    address: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    phone_number: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None  # Added name
    last_name: Optional[str] = None  # Added last_name
    address: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    phone_number: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: RoleEnum

class ResetPassword(BaseModel):
    reset_token: str
    new_password: str

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class MessageResponse(BaseModel):
    message: str