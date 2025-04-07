from sqlalchemy.orm import Session, joinedload
from models.category import Category
import schemas.category as category_schemas
from typing import Optional

def create_category(db: Session, category: category_schemas.CategoryCreate):
    """
    Create a new category with optional image URL
    """
    db_category = Category(
        name=category.name,
        description=category.description,
        parent_id=category.parent_id,
        image_url=category.image_url  # Store the URL directly
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_category(db: Session, category_id: int):
    """
    Get a single category by ID with its subcategories
    """
    return (
        db.query(Category)
        .options(joinedload(Category.subcategories))
        .filter(Category.id == category_id)
        .first()
    )

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    """
    Get paginated list of categories with their subcategories
    """
    return (
        db.query(Category)
        .options(joinedload(Category.subcategories))
        .offset(skip)
        .limit(limit)
        .all()
    )

def update_category(
    db: Session, 
    category_id: int, 
    category: category_schemas.CategoryUpdate
):
    """
    Update category information including image URL
    """
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        return None
    
    update_data = category.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    """
    Delete a category (no image files to handle since we're using URLs)
    """
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        return None
    
    db.delete(db_category)
    db.commit()
    return db_category