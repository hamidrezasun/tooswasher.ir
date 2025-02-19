from pydantic import BaseModel

# User Model (Pydantic Schema)
class User(BaseModel):
    id: int
    username: str
    email: str

# In-memory database
users_db = []