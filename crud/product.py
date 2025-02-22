# crud/product.py
from sqlalchemy.orm import Session, joinedload
from models.product import Product
from models.category import Category
import schemas.product as product_schemas
from sqlalchemy.orm import relationship

# Ensure relationship is defined in models/product.py, not here
# Product.category = relationship("Category")  # Move this to models/product.py

def create_product(db: Session, product: product_schemas.ProductCreate, owner_id: int):
    # Validate category_id exists
    if not db.query(Category).filter(Category.id == product.category_id).first():
        raise ValueError(f"Category with id {product.category_id} does not exist")
    db_product = Product(**product.dict(), owner_id=owner_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    db_product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == db_product.id).first()
    return db_product

def get_product(db: Session, product_id: int):
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).options(joinedload(Product.category)).offset(skip).limit(limit).all()

def update_product(db: Session, product_id: int, product: product_schemas.ProductUpdate):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    
    update_data = product.dict(exclude_unset=True)
    # If category_id is being updated, validate it exists
    if "category_id" in update_data:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise ValueError(f"Category with id {update_data['category_id']} does not exist")
    
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    # Reload with category relationship
    db_product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == db_product.id).first()
    if db_product.category is None:
        raise ValueError(f"Product {db_product.id} has an invalid category_id after update")
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product