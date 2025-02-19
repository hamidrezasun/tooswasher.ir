from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.auth import get_db,get_current_user
from utils.password import hash_password
from models.user import User as DBUser  # Rename to avoid confusion
from schemas.user import UserCreate, User

user_router = APIRouter()

@user_router.post("/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Hash the password before storing it
    hashed_password = hash_password(user.password)
    
    # Create a SQLAlchemy User object (DBUser)
    db_user = DBUser(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True,  # Set default value
        role="customer"  # Set default role
    )
    
    # Add and commit to the database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return the Pydantic User schema (response model)
    return db_user

@user_router.get("/me", response_model=User)
def read_user_me(current_user: DBUser = Depends(get_current_user)):
    return current_user