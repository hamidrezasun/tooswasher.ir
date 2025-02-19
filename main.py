from fastapi import FastAPI
from routes.user import user_router
from routes.product import product_router
from models.base import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Include routers
app.include_router(user_router, prefix="/users", tags=["users"])
app.include_router(product_router, prefix="/products", tags=["products"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the E-commerce API"}