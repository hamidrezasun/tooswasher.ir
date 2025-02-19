from pydantic import BaseModel

# Schema for creating a product
class ProductCreate(BaseModel):
    name: str
    price: float

# Schema for returning a product
class ProductResponse(BaseModel):
    id: int
    name: str
    price: float

    class Config:
        from_attributes = True