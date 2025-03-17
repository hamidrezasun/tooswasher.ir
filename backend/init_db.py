import logging
import os
from database import Base, engine, SessionLocal
from crud.user import get_user_by_username, create_user
from schemas.user import UserCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INIT_FLAG = "/app/.init_done"

def initialize_app():
    if os.path.exists(INIT_FLAG):
        logger.info("Application already initialized, skipping setup")
        return

    logger.info("Initializing application...")
    try:
        Base.metadata.create_all(bind=engine, checkfirst=True)
        logger.info("Database tables checked/created successfully")
    except Exception as e:
        logger.error(f"Error during table creation: {e}")
        return

    db = SessionLocal()
    try:
        admin_username = "admin"
        existing_admin = get_user_by_username(db, admin_username)
        if not existing_admin:
            admin_user = UserCreate(
                username=admin_username,
                email="admin@example.com",
                password="1234",  # Change in production!
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

        with open(INIT_FLAG, "w") as f:
            f.write("done")
    except Exception as e:
        logger.error(f"Error during initialization: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    initialize_app()