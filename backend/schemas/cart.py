from pydantic import BaseModel

class CartBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartCreate(CartBase):
    pass

class Cart(CartBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True