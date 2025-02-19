from fastapi import APIRouter, Depends, HTTPException, status
from app.models.product import products_db, Product
from app.schemas.product import ProductCreate, ProductResponse
from app.dependencies import get_current_user
from app.models.user import UserRole,User
from typing import List

router = APIRouter(prefix="/api/products", tags=["products"])

# Create a new product (only for admins)
@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create products",
        )
    new_product = Product(id=len(products_db) + 1, name=product.name, price=product.price)
    products_db.append(new_product)
    return new_product

# Get all products (accessible to all users)
@router.get("/", response_model=List[ProductResponse])
def get_products():
    return products_db

# Get a single product by ID (accessible to all users)
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int):
    for product in products_db:
        if product.id == product_id:
            return product
    raise HTTPException(status_code=404, detail="Product not found")

# Update a product by ID (only for admins)
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    updated_product: ProductCreate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update products",
        )
    for index, product in enumerate(products_db):
        if product.id == product_id:
            products_db[index] = Product(id=product_id, name=updated_product.name, price=updated_product.price)
            return products_db[index]
    raise HTTPException(status_code=404, detail="Product not found")

# Delete a product by ID (only for admins)
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete products",
        )
    for index, product in enumerate(products_db):
        if product.id == product_id:
            products_db.pop(index)
            return {"message": "Product deleted successfully"}
    raise HTTPException(status_code=404, detail="Product not found")