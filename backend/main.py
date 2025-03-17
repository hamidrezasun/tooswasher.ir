# main.py
from fastapi import FastAPI
import uvicorn
from database import Base, engine, SessionLocal
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
import logging
import asyncio
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Use a lock to ensure startup runs only once
startup_lock = asyncio.Lock()
INIT_FLAG = "/app/.init_done"  # File to mark initialization

async def initialize_app():
    """Run one-time initialization tasks."""
    if os.path.exists(INIT_FLAG):
        logger.info("Application already initialized, skipping setup")
        return

    logger.info("Initializing application...")
    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("Database tables checked/created successfully")
    except Exception as e:
        logger.error(f"Error during table creation: {e}")

    db = SessionLocal()
    try:
        admin_username = "admin"
        existing_admin = get_user_by_username(db, admin_username)
        if not existing_admin:
            admin_user = UserCreate(
                username=admin_username,
                email="admin@example.com",
                password="1234",  # Change this in production!
                national_id="0000000000",
                address="Admin Street",
                state="Admin State",
                city="Admin City",
                phone_number="000-000-0000"
            )
            db_user = create_user(db, admin_user)
            db_user.role = "admin"
            db.commit()
            db.refresh(db_user)
            logger.info("Default admin user created")
        else:
            logger.info("Admin user already exists, skipping creation")
        
        # Mark initialization as done
        with open(INIT_FLAG, "w") as f:
            f.write("done")
    except Exception as e:
        logger.error(f"Error during initialization: {e}")
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    async with startup_lock:
        await initialize_app()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8008)