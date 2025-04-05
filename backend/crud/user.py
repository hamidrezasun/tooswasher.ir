# crud/user.py
from sqlalchemy.orm import Session
from models.user import User, RoleEnum
import schemas.user as user_schemas
from utils import get_password_hash, verify_password
import secrets
from datetime import datetime, timedelta
from sqlalchemy import or_,delete
from models.event import event_staff # import the association table

def generate_reset_token(db: Session, email: str):
    user = get_user_by_email(db, email)
    if not user:
        raise ValueError("User not found")
    
    reset_token = secrets.token_urlsafe(32)
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    
    user.reset_token = reset_token
    user.reset_token_expires = reset_token_expires
    db.commit()
    db.refresh(user)
    return reset_token

def validate_reset_token(db: Session, reset_token: str):
    user = db.query(User).filter(User.reset_token == reset_token).first()
    if not user or user.reset_token_expires < datetime.utcnow():
        raise ValueError("Invalid or expired reset token")
    return user

def reset_password(db: Session, reset_token: str, new_password: str):
    user = validate_reset_token(db, reset_token)
    if not user:
        raise ValueError("Invalid or expired reset token")
    
    user.hashed_password = get_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    
    db.commit()
    db.refresh(user)
    return user

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_national_id(db: Session, national_id: str):
    return db.query(User).filter(User.national_id == national_id).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user: user_schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        last_name=user.last_name,
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

def update_user_role(db: Session, user_id: int, role: RoleEnum):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise ValueError("User not found")
    db_user.role = role
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_password(db: Session, user_id: int, old_password: str, new_password: str):
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    if not verify_password(old_password, user.hashed_password):
        raise ValueError("Old password is incorrect")
    
    if old_password == new_password:
        raise ValueError("New password cannot be the same as the old password")
    
    user.hashed_password = get_password_hash(new_password)
    
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, user_update: user_schemas.UserUpdate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    if user_update.email and user_update.email != user.email: #Check if the new email exists, and is different from the old email.
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise ValueError("Email already in use")

    if user_update.email:
        user.email = user_update.email
    if user_update.name:
        user.name = user_update.name
    if user_update.last_name:
        user.last_name = user_update.last_name
    if user_update.address:
        user.address = user_update.address
    if user_update.state:
        user.state = user_update.state
    if user_update.city:
        user.city = user_update.city
    if user_update.phone_number:
        user.phone_number = user_update.phone_number

    db.commit()
    db.refresh(user)
    return user

def search_users_by_role(db: Session, role: RoleEnum, skip: int = 0, limit: int = 100):
    """Search users by their role."""
    return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()

def search_users_by_username(db: Session, username: str, skip: int = 0, limit: int = 100):
    """Search users by username (partial match)."""
    return db.query(User).filter(User.username.ilike(f"%{username}%")).offset(skip).limit(limit).all()

def search_users_by_email(db: Session, email: str, skip: int = 0, limit: int = 100):
    """Search users by email (partial match)."""
    return db.query(User).filter(User.email.ilike(f"%{email}%")).offset(skip).limit(limit).all()

def search_users_by_national_id(db: Session, national_id: str, skip: int = 0, limit: int = 100):
    """Search users by national ID (partial match)."""
    return db.query(User).filter(User.national_id.ilike(f"%{national_id}%")).offset(skip).limit(limit).all()

def search_users_by_name(db: Session, name: str, skip: int = 0, limit: int = 100):
    """Search users by name or last name (partial match)."""
    return db.query(User).filter(
        or_(
            User.name.ilike(f"%{name}%"),
            User.last_name.ilike(f"%{name}%")
        )
    ).offset(skip).limit(limit).all()

def search_users_by_phone_number(db: Session, phone_number: str, skip: int = 0, limit: int = 100):
    """Search users by phone number (partial match)."""
    return db.query(User).filter(User.phone_number.ilike(f"%{phone_number}%")).offset(skip).limit(limit).all()

def delete_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise ValueError("User not found")

    # Delete related event_staff records
    stmt = delete(event_staff).where(event_staff.c.user_id == user_id)
    db.execute(stmt)

    db.delete(db_user)
    db.commit()
    return db_user

def admin_update_user(db: Session, user_id: int, user_update: user_schemas.AdminUserUpdate):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        raise ValueError("User not found")

    if user_update.username and user_update.username != db_user.username:
        existing_username = get_user_by_username(db, user_update.username)
        if existing_username:
            raise ValueError("Username already in use")

    if user_update.email and user_update.email != db_user.email:
        existing_email = get_user_by_email(db, user_update.email)
        if existing_email:
            raise ValueError("Email already in use")

    if user_update.national_id and user_update.national_id != db_user.national_id:
        existing_national_id = get_user_by_national_id(db, user_update.national_id)
        if existing_national_id:
            raise ValueError("National ID already in use")

    if user_update.password:
        hashed_password = get_password_hash(user_update.password)
        db_user.hashed_password = hashed_password

    if user_update.username:
        db_user.username = user_update.username
    if user_update.email:
        db_user.email = user_update.email
    if user_update.name:
        db_user.name = user_update.name
    if user_update.last_name:
        db_user.last_name = user_update.last_name
    if user_update.address:
        db_user.address = user_update.address
    if user_update.state:
        db_user.state = user_update.state
    if user_update.city:
        db_user.city = user_update.city
    if user_update.phone_number:
        db_user.phone_number = user_update.phone_number
    if user_update.role:
        db_user.role = user_update.role

    db.commit()
    db.refresh(db_user)
    return db_user