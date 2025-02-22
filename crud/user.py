from sqlalchemy.orm import Session
from models.user import User, RoleEnum
import schemas.user as user_schemas
from utils import get_password_hash,verify_password
import secrets
from datetime import datetime, timedelta

def generate_reset_token(db: Session, email: str):
    user = get_user_by_email(db, email)
    if not user:
        raise ValueError("User not found")
    
    # Generate a secure token
    reset_token = secrets.token_urlsafe(32)
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    
    # Save the token and expiration time in the database
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
    
    # Hash the new password
    user.hashed_password = get_password_hash(new_password)
    
    # Clear the reset token and expiration time
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

def update_user_password(db: Session, user_id: int, old_password: str, new_password: str):
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    
    # Verify the old password
    if not verify_password(old_password, user.hashed_password):
        raise ValueError("Old password is incorrect")
    
    # Prevent users from setting the same password
    if old_password == new_password:
        raise ValueError("New password cannot be the same as the old password")
    
    # Hash the new password and update
    user.hashed_password = get_password_hash(new_password)
    
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, user_update: user_schemas.UserUpdate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    # Update only the provided fields
    if user_update.email:
        user.email = user_update.email
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
