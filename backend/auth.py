# auth.py
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from typing import Optional
import os
from dotenv import load_dotenv
from database import get_db
from models.user import User, RoleEnum

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
REFRESH_TOKEN_SECRET = os.getenv("REFRESH_TOKEN_SECRET", SECRET_KEY + "_refresh")
ALGORITHM = "HS256"

# Token expiration times
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 minutes for access token
REFRESH_TOKEN_EXPIRE_DAYS = 30    # 30 days for "remember me" refresh token
DEFAULT_REFRESH_EXPIRE_HOURS = 12 # 12 hours for regular refresh token

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/users/token",
    auto_error=False  # Disable auto-error for optional authentication
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the hashed version."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate a user with username and password."""
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: timedelta) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    return jwt.encode(to_encode, REFRESH_TOKEN_SECRET, algorithm=ALGORITHM)

def create_tokens(data: dict, remember_me: bool = False) -> dict:
    """Create both access and refresh tokens."""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data=data,
        expires_delta=access_token_expires
    )
    
    if remember_me:
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    else:
        refresh_token_expires = timedelta(hours=DEFAULT_REFRESH_EXPIRE_HOURS)
    
    refresh_token = create_refresh_token(
        data=data,
        expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds())
    }

def verify_access_token(token: str) -> Optional[dict]:
    """Verify an access token and return the payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify a refresh token and return the payload."""
    try:
        payload = jwt.decode(token, REFRESH_TOKEN_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Dependency to get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    payload = verify_access_token(token)
    if not payload:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[dict]:
    """Dependency for optional authentication (returns None if not authenticated)."""
    if not token:
        return None
    
    payload = verify_access_token(token)
    if not payload:
        return None
    
    username: str = payload.get("sub")
    if username is None:
        return None
    
    user = get_user_by_username(db, username=username)
    return user

async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
):
    """Dependency to get the current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_current_admin_user(
    current_user: dict = Depends(get_current_active_user)
):
    """Dependency to verify admin privileges."""
    if current_user.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

async def get_current_staff_user(
    current_user: dict = Depends(get_current_active_user)
):
    """Dependency to verify staff or admin privileges."""
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff privileges required"
        )
    return current_user

def get_user_by_username(db: Session, username: str):
    """Helper function to get user by username."""
    return db.query(User).filter(User.username == username).first()