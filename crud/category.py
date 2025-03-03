# crud/category.py
from sqlalchemy.orm import Session, joinedload
from models.category import Category
import schemas.category as category_schemas

def create_category(db: Session, category: category_schemas.CategoryCreate):
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_category(db: Session, category_id: int):
    return (
        db.query(Category)
        .options(joinedload(Category.subcategories))  # Load subcategories eagerly
        .filter(Category.id == category_id)
        .first()
    )

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Category)
        .options(joinedload(Category.subcategories))  # Load subcategories eagerly
        .offset(skip)
        .limit(limit)
        .all()
    )

def update_category(db: Session, category_id: int, category: category_schemas.CategoryCreate):
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
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        return None
    db.delete(db_category)
    db.commit()
    return db_category