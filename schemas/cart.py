from pydantic import BaseModel

class CartBase(BaseModel):
    user_id: int
    product_id: int
    quantity: int

class CartCreate(CartBase):
    pass

class Cart(CartBase):
    id: int

    class Config:
        from_attributes = True