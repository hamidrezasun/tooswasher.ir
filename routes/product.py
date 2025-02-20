from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.auth import get_current_user, get_db
from models.user import User
from models.product import Product
from schemas.product import ProductCreate, Product

product_router = APIRouter()

@product_router.post("/", response_model=Product)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create products")
    db_product = Product(
        name=product.name,
        description=product.description,
        price=product.price,
        image_url=product.image_url,
        amount=product.amount
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@product_router.get("/{product_id}", response_model=Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product