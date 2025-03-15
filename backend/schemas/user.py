# schemas/user.py
from pydantic import BaseModel, Field
from typing import Optional
from pydantic import ConfigDict
from enum import Enum

class RoleEnum(str, Enum):
    """User roles within the system."""
    customer = "customer"
    admin = "admin"
    staff = "staff"

class UserBase(BaseModel):
    """Base schema for user-related data."""
    username: Optional[str] = Field(None, description="Unique username for the user")
    email: Optional[str] = Field(None, description="User's email address")
    name: Optional[str] = Field(None, description="User's first name")
    last_name: Optional[str] = Field(None, description="User's last name")

    model_config = ConfigDict(from_attributes=True)

class User(UserBase):
    """Full user schema including database-generated fields."""
    id: int = Field(..., description="Unique identifier for the user")
    is_active: Optional[bool] = Field(True, description="Indicates if the user account is active")
    role: RoleEnum = Field(..., description="User's role in the system (customer, admin, staff)")
    national_id: Optional[str] = Field(None, description="User's national identification number")
    address: Optional[str] = Field(None, description="User's street address")
    state: Optional[str] = Field(None, description="User's state or province")
    city: Optional[str] = Field(None, description="User's city")
    phone_number: Optional[str] = Field(None, description="User's phone number")

class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username: str = Field(..., description="Unique username for the user")
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's password (will be hashed)")
    name: Optional[str] = Field(None, description="User's first name")
    last_name: Optional[str] = Field(None, description="User's last name")
    national_id: str = Field(..., description="User's national identification number")
    address: Optional[str] = Field(None, description="User's street address")
    state: Optional[str] = Field(None, description="User's state or province")
    city: Optional[str] = Field(None, description="User's city")
    phone_number: Optional[str] = Field(None, description="User's phone number")

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    """Schema for updating user details."""
    email: Optional[str] = Field(None, description="User's email address")
    name: Optional[str] = Field(None, description="User's first name")
    last_name: Optional[str] = Field(None, description="User's last name")
    address: Optional[str] = Field(None, description="User's street address")
    state: Optional[str] = Field(None, description="User's state or province")
    city: Optional[str] = Field(None, description="User's city")
    phone_number: Optional[str] = Field(None, description="User's phone number")

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    """Schema for authentication token response."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(..., description="Type of token (e.g., 'bearer')")

class TokenData(BaseModel):
    """Schema for data encoded in the token."""
    username: Optional[str] = Field(None, description="Username encoded in the token")

class UserRoleUpdate(BaseModel):
    """Schema for updating a user's role."""
    role: RoleEnum = Field(..., description="New role for the user (customer, admin, staff)")

class ResetPassword(BaseModel):
    """Schema for resetting a user's password."""
    reset_token: str = Field(..., description="Token for password reset")
    new_password: str = Field(..., description="New password to set")

class ChangePassword(BaseModel):
    """Schema for changing a user's password."""
    old_password: str = Field(..., description="Current password")
    new_password: str = Field(..., description="New password to set")

class MessageResponse(BaseModel):
    """Schema for simple message responses."""
    message: str = Field(..., description="Response message")

class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None
    last_name: Optional[str] = None
    national_id: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[RoleEnum] = None