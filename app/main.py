from fastapi import FastAPI
from app.routers.user import router as user_router
from app.routers.product import router as product_router
from app.routers.auth import router as auth_router

app = FastAPI()

# Include all routers
app.include_router(user_router)
app.include_router(product_router)
app.include_router(auth_router)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI E-Commerce App!"}