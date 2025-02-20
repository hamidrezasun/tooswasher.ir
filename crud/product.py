from sqlalchemy.orm import Session
from models.product import Product
import schemas.product as product_schemas

def create_product(db: Session, product: product_schemas.ProductCreate, owner_id: int):
    
    db_product = Product(**product.dict(), owner_id=owner_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).offset(skip).limit(limit).all()