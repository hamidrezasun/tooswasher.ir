from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud.product as product_crud
import schemas.product as product_schemas
import schemas.user as user_schemas
import auth
from database import get_db

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

@router.post("/", response_model=product_schemas.Product)
def create_product(
    product: product_schemas.ProductCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return product_crud.create_product(db=db, product=product, owner_id=current_user.id)

@router.get("/", response_model=List[product_schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = product_crud.get_products(db, skip=skip, limit=limit)
    return products

@router.get("/{product_id}", response_model=product_schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = product_crud.get_product(db, product_id=product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product