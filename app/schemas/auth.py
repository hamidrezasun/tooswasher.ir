from pydantic import BaseModel

# Schema for user login
class UserLogin(BaseModel):
    username: str
    password: str

# Schema for JWT token
class Token(BaseModel):
    access_token: str
    token_type: str