from fastapi import FastAPI
from app.routers.user import router as user_router

app = FastAPI()

# Include the routers
app.include_router(user_router)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI E-Commerce App!"}