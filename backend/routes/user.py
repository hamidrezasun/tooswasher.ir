# routes/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
import crud.user as user_crud
import schemas.user as user_schemas
import auth
from database import get_db
from models.user import RoleEnum

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/register", response_model=user_schemas.User)
def register(user: user_schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = user_crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_email = user_crud.get_user_by_email(db, email=user.email)
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_national_id = user_crud.get_user_by_national_id(db, national_id=user.national_id)
    if db_national_id:
        raise HTTPException(status_code=400, detail="National ID already registered")
    return user_crud.create_user(db=db, user=user)

@router.post("/token", response_model=user_schemas.TokenWithRefresh)
def login_for_access_token(
    login_data: user_schemas.LoginRequest,  # Changed from OAuth2PasswordRequestForm
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_data = {"sub": user.username, "role": user.role.value}
    tokens = auth.create_tokens(token_data, login_data.remember_me)
    
    return tokens

@router.post("/refresh", response_model=user_schemas.Token)
def refresh_access_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    payload = auth.verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    username = payload.get("sub")
    user = user_crud.get_user_by_username(db, username=username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.get("/me", response_model=user_schemas.User)
async def read_users_me(current_user: user_schemas.User = Depends(auth.get_current_active_user)):
    return current_user

@router.get("/all", response_model=List[user_schemas.User])
def read_all_users(
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    return db.query(user_crud.User).all()

@router.put("/{user_id}/role", response_model=user_schemas.User)
async def update_user_role(
    user_id: int,
    role_update: user_schemas.UserRoleUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    try:
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot change your own role")
        updated_user = user_crud.update_user_role(db, user_id, role_update.role)
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/request-password-reset")
async def request_password_reset(
    email: str,
    db: Session = Depends(get_db)
):
    user = user_crud.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reset_token = user_crud.generate_reset_token(db, email)
    return {"message": "Password reset token generated", "reset_token": reset_token}

@router.post("/reset-password")
async def reset_password(
    reset_data: user_schemas.ResetPassword,
    db: Session = Depends(get_db)
):
    try:
        user = user_crud.validate_reset_token(db, reset_data.reset_token)
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        user_crud.reset_password(db, reset_data.reset_token, reset_data.new_password)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/change-password", response_model=user_schemas.MessageResponse)
async def change_password(
    password_data: user_schemas.ChangePassword,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not auth.verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    if password_data.old_password == password_data.new_password:
        raise HTTPException(status_code=400, detail="New password cannot be the same as old password")

    user_crud.update_user_password(db, current_user.id, password_data.old_password, password_data.new_password)
    return {"message": "Password changed successfully"}

@router.put("/edit", response_model=user_schemas.User)
async def edit_user(
    user_update: user_schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_active_user)
):
    try:
        updated_user = user_crud.update_user(db, current_user.id, user_update)
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.get("/search-by-id/", response_model=user_schemas.User)
def get_usr_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
):
    user = user_crud.get_user_by_id(db,user_id=id)
    return user

@router.get("/search-by-role/", response_model=List[user_schemas.User])
def search_users_by_role(
    role: RoleEnum,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    """Search users by their role."""
    users = user_crud.search_users_by_role(db, role=role, skip=skip, limit=limit)
    return users

@router.get("/search-by-username/", response_model=List[user_schemas.User])
def search_users_by_username(
    username: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    """Search users by username (partial match)."""
    users = user_crud.search_users_by_username(db, username=username, skip=skip, limit=limit)
    return users

@router.get("/search-by-email/", response_model=List[user_schemas.User])
def search_users_by_email(
    email: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    """Search users by email (partial match)."""
    users = user_crud.search_users_by_email(db, email=email, skip=skip, limit=limit)
    return users

@router.get("/search-by-national-id/", response_model=List[user_schemas.User])
def search_users_by_national_id(
    national_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    """Search users by national ID (partial match)."""
    users = user_crud.search_users_by_national_id(db, national_id=national_id, skip=skip, limit=limit)
    return users

@router.get("/search-by-name/", response_model=List[user_schemas.User])
def search_users_by_name(
    name: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    """Search users by name or last name (partial match)."""
    users = user_crud.search_users_by_name(db, name=name, skip=skip, limit=limit)
    return users

@router.get("/search-by-phone-number/", response_model=List[user_schemas.User])
def search_users_by_phone_number(
    phone_number: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    """Search users by phone number (partial match)."""
    users = user_crud.search_users_by_phone_number(db, phone_number=phone_number, skip=skip, limit=limit)
    return users

@router.delete("/{user_id}", response_model=user_schemas.MessageResponse)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    try:
        user_crud.delete_user(db, user_id)
        return {"message": "User deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.put("/{user_id}/admin-update", response_model=user_schemas.User)
async def admin_update_user(
    user_id: int,
    user_update: user_schemas.AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: user_schemas.User = Depends(auth.get_current_admin_user)
):
    """
    Update all user attributes by ID. Only accessible by admin.
    """
    try:
        updated_user = user_crud.admin_update_user(db, user_id, user_update)
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))