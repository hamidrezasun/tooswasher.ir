# crud/product.py
from sqlalchemy.orm import Session, joinedload
from models.product import Product
from models.category import Category
from models.discount import Discount
import schemas.product as product_schemas
from fastapi import HTTPException

def create_product(db: Session, product: product_schemas.ProductCreate, owner_id: int):
    if not db.query(Category).filter(Category.id == product.category_id).first():
        raise ValueError(f"Category with id {product.category_id} does not exist")
    db_product = Product(**product.dict(), owner_id=owner_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    db_product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == db_product.id).first()
    return db_product

def get_product(db: Session, product_id: int, user_id: int = None):
    """
    Retrieve a product by its ID, including applicable discount if the user is logged in.
    """
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()
    if not product:
        return None
    
    # Check for applicable discount if user is logged in
    if user_id:
        discount = (
                db.query(Discount)
                .filter(
                    (Discount.product_id == product.id) | (Discount.customer_id == user_id),
                )
                .first()
            )
        if discount:
            product.discount = {
                "id": discount.id,
                "code": discount.code,
                "percent": discount.percent,
                "max_discount": discount.max_discount
            }
        else:
            product.discount = None
    else:
        product.discount = None
    
    return product

def get_products(db: Session, skip: int = 0, limit: int = 100, user_id: int = None):
    """
    Retrieve a list of products, including discounts if the user is logged in.
    """
    products = db.query(Product).options(joinedload(Product.category)).offset(skip).limit(limit).all()
    
    if user_id:
        for product in products:
            discount = (
                db.query(Discount)
                .filter(
                    (Discount.product_id == product.id) | (Discount.customer_id == user_id),
                )
                .first()
            )
            if discount:
                product.discount = {
                    "id": discount.id,
                    "code": discount.code,
                    "percent": discount.percent,
                    "max_discount": discount.max_discount
                }
            else:
                product.discount = None
    else:
        for product in products:
            product.discount = None
    
    return products

def update_product(db: Session, product_id: int, product: product_schemas.ProductUpdate):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    
    update_data = product.dict(exclude_unset=True)
    if "category_id" in update_data:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise ValueError(f"Category with id {update_data['category_id']} does not exist")
    
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
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

def search_products_by_name(db: Session, query: str, skip: int = 0, limit: int = 100, user_id: int = None):
    """Search products by name."""
    products = db.query(Product).filter(
        Product.name.ilike(f"%{query}%")  # Case-insensitive search
    ).options(joinedload(Product.category)).offset(skip).limit(limit).all()
    
    if user_id:
        for product in products:
            discount = db.query(Discount).filter(
                (Discount.product_id == product.id) | (Discount.product_id.is_(None)),
                (Discount.customer_id == user_id) | (Discount.customer_id.is_(None))
            ).first()
            if discount:
                product.discount = {
                    "id": discount.id,
                    "code": discount.code,
                    "percent": discount.percent,
                    "max_discount": discount.max_discount
                }
            else:
                product.discount = None
    else:
        for product in products:
            product.discount = None
    return products