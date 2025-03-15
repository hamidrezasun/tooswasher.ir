from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud.category as category_crud
import schemas.category as category_schemas
import schemas.user as user_schemas
import auth
from database import get_db
from models.category import Category

router = APIRouter(
    prefix="/categories",
    tags=["categories"]
)

@router.post("/", response_model=category_schemas.Category)
def create_category(
    category: category_schemas.CategoryCreate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Check if category name already exists
    existing_category = db.query(Category).filter(Category.name == category.name).first()
    if existing_category:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    # Check if parent_id is valid (if provided)
    if category.parent_id is not None:
        parent_category = db.query(Category).filter(Category.id == category.parent_id).first()
        if not parent_category:
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    return category_crud.create_category(db=db, category=category)

@router.get("/", response_model=List[category_schemas.Category])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    categories = category_crud.get_categories(db, skip=skip, limit=limit)
    return categories

@router.get("/{category_id}", response_model=category_schemas.Category)
def read_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = category_crud.get_category(db, category_id=category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=category_schemas.Category)
def update_category(
    category_id: int,
    category: category_schemas.CategoryCreate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Check if the category exists
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts with existing categories
    existing_category = db.query(Category).filter(
        Category.name == category.name,
        Category.id != category_id
    ).first()
    if existing_category:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    # Check if parent_id is valid (if provided)
    if category.parent_id is not None:
        parent_category = db.query(Category).filter(Category.id == category.parent_id).first()
        if not parent_category:
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    updated_category = category_crud.update_category(db, category_id=category_id, category=category)
    return updated_category

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Optional: Check if category is in use by products
    from models.product import Product
    product_count = db.query(Product).filter(Product.category_id == category_id).count()
    if product_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category that is in use by products"
        )
    
    # Check if category has subcategories
    subcategory_count = db.query(Category).filter(Category.parent_id == category_id).count()
    if subcategory_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category that has subcategories"
        )
    
    deleted_category = category_crud.delete_category(db, category_id=category_id)
    if deleted_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return None