from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.auth import get_current_user, get_db
from utils.password import hash_password
from models.user import User
from schemas.user import UserCreate, User

user_router = APIRouter()

@user_router.post("/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = hash_password(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True,
        role="customer",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@user_router.get("/me", response_model=User)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user