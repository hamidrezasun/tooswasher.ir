from pydantic import BaseModel

# Product Model
class Product(BaseModel):
    id: int
    name: str
    price: float

# In-memory database
products_db = []