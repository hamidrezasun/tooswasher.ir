from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import crud.product as product_crud
import schemas.product as product_schemas
import schemas.user as user_schemas
import auth
from database import get_db
from models.discount import DiscountStatus

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

@router.post("/", response_model=product_schemas.Product, 
            description="Only admin users can create products.")
def create_product(
    product: product_schemas.ProductCreate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    try:
        return product_crud.create_product(db=db, product=product, owner_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[product_schemas.Product],
           description="Retrieve products with optional filters.")
def read_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    has_discount: Optional[bool] = Query(None),
    current_user: Optional[user_schemas.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    products = product_crud.get_products(db, skip=skip, limit=limit, user_id=user_id)
    
    # Apply additional filters
    if category_id:
        products = [p for p in products if p.category_id == category_id]
    if min_price is not None:
        products = [p for p in products if p.price >= min_price]
    if max_price is not None:
        products = [p for p in products if p.price <= max_price]
    if has_discount is not None:
        if has_discount:
            products = [p for p in products if p.discount is not None]
        else:
            products = [p for p in products if p.discount is None]
    
    return products

@router.get("/{product_id}", response_model=product_schemas.Product,
           description="Get product details with applicable active discount.")
def read_product(
    product_id: int,
    current_user: Optional[user_schemas.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    product = product_crud.get_product(db, product_id=product_id, user_id=user_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify discount status if present
    if product.discount and product.discount.get('status') != DiscountStatus.ACTIVE.value:
        product.discount = None
    
    return product

@router.put("/{product_id}", response_model=product_schemas.Product,
           description="Only admin users can update products.")
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

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT,
              description="Only admin users can delete products.")
def delete_product(
    product_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    if not product_crud.delete_product(db, product_id=product_id):
        raise HTTPException(status_code=404, detail="Product not found")

@router.get("/search/", response_model=List[product_schemas.Product],
           description="Search products by name with active discounts.")
def search_products(
    query: str,
    skip: int = 0,
    limit: int = 100,
    only_discounted: Optional[bool] = Query(False),
    current_user: Optional[user_schemas.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    products = product_crud.search_products_by_name(db, query=query, skip=skip, limit=limit, user_id=user_id)
    
    if only_discounted:
        products = [p for p in products if p.discount is not None]
    
    return products