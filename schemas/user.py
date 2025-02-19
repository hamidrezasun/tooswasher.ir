from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str  # Password field for user creation

class User(UserBase):
    id: int
    is_active: bool
    role: str

    class Config:
        from_attributes = True