# main.py
from fastapi import FastAPI
import uvicorn
from database import Base, engine, SessionLocal  # Import SessionLocal
from routes.user import router as user_router
from routes.product import router as product_router
from routes.cart import router as cart_router
from routes.page import router as page_router
from routes.category import router as category_router
from routes.order import router as order_router
from routes.discount import router as discount_router
from routes.payment import router as payment_router
from routes.event import router as event_router
from routes.files import router as file_router
from crud.user import get_user_by_username, create_user
from schemas.user import UserCreate
from fastapi.middleware.cors import CORSMiddleware

# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="طوس واشر",
    version="0.1",
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow your React frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)
# Include routers
app.include_router(user_router)
app.include_router(product_router)
app.include_router(cart_router)
app.include_router(category_router)
app.include_router(page_router)
app.include_router(order_router)
app.include_router(discount_router)
app.include_router(payment_router)
app.include_router(event_router)
app.include_router(file_router)

def create_default_admin():
    """Create a default admin user if it doesn't exist."""
    admin_username = "admin"
    admin_email = "admin@example.com"
    admin_password = "1234"  # Change this in production!
    
    # Use a session instance
    db = SessionLocal()
    try:
        existing_admin = get_user_by_username(db, admin_username)
        if not existing_admin:
            admin_user = UserCreate(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                national_id="0000000000",
                address="Admin Street",
                state="Admin State",
                city="Admin City",
                phone_number="000-000-0000"
            )
            db_user = create_user(db, admin_user)
            db_user.role = "admin"  # Assuming User model has a 'role' column
            db.commit()
            db.refresh(db_user)
    finally:
        db.close()

# Call the function during startup
create_default_admin()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)