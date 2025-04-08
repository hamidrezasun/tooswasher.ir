# routers/product.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import crud.product as product_crud
import schemas.product as product_schemas
import schemas.user as user_schemas
import auth
from database import get_db

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

@router.post("/", response_model=product_schemas.Product, description="Only users with role admin can create products.")
def create_product(
    product: product_schemas.ProductCreate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    try:
        return product_crud.create_product(db=db, product=product, owner_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[product_schemas.Product], description="Retrieve a list of products. Discounts are included for logged-in users.")
def read_products(
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[user_schemas.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    return product_crud.get_products(db, skip=skip, limit=limit, user_id=user_id)

@router.get("/{product_id}", response_model=product_schemas.Product, description="Retrieve a product by its ID. Discounts are included for logged-in users.")
def read_product(
    product_id: int,
    current_user: Optional[user_schemas.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    product = product_crud.get_product(db, product_id=product_id, user_id=user_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=product_schemas.Product, description="Only users with role admin can update products.")
def update_product(
    product_id: int,
    product: product_schemas.ProductUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        updated_product = product_crud.update_product(db, product_id=product_id, product=product)
        if updated_product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return updated_product
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, description="Only users with role admin can delete products.")
def delete_product(
    product_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    deleted_product = product_crud.delete_product(db, product_id=product_id)
    if deleted_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return None

@router.get("/search/", response_model=List[product_schemas.Product], description="Search products by name.")
def search_products(
    query: str,
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[user_schemas.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Search products by name."""
    user_id = current_user.id if current_user else None
    products = product_crud.search_products_by_name(db, query=query, skip=skip, limit=limit, user_id=user_id)
    return products