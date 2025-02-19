from pydantic import BaseModel

# Schema for creating a user
class UserCreate(BaseModel):
    username: str
    email: str

# Schema for returning a user
class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True