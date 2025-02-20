from sqlalchemy.orm import Session
from models.user import User, RoleEnum
import schemas.user as user_schemas
from utils import get_password_hash

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_national_id(db: Session, national_id: str):
    return db.query(User).filter(User.national_id == national_id).first()

def get_user_by_id(db: Session, user_id: int):  # New function
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user: user_schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=RoleEnum.customer,
        national_id=user.national_id,
        address=user.address,
        state=user.state,
        city=user.city,
        phone_number=user.phone_number
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_role(db: Session, user_id: int, role: RoleEnum):  # New function
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise ValueError("User not found")
    db_user.role = role
    db.commit()
    db.refresh(db_user)
    return db_user