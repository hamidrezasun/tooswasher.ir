from pydantic import BaseModel
from enum import Enum

# User Roles
class UserRole(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"

# User Model (Pydantic Schema)
class User(BaseModel):
    id: int
    username: str
    hashed_password: str  # Store hashed passwords
    email: str
    state: str
    city: str
    national_id: str
    role: UserRole = UserRole.CUSTOMER  # Default role is "customer"

# In-memory database
users_db = []