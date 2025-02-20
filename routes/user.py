from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
import crud.user as user_crud
import schemas.user as user_schemas
import auth
from database import get_db

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

@router.post("/token", response_model=user_schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Ensure the latest role from the database is used
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

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
    
    # Generate a reset token
    reset_token = user_crud.generate_reset_token(db, email)
    
    # Send the reset token via email (optional)
    # send_reset_email(email, reset_token)
    
    return {"message": "Password reset token generated", "reset_token": reset_token}

# New Endpoint: Reset Password
@router.post("/reset-password")
async def reset_password(
    reset_data: user_schemas.ResetPassword,
    db: Session = Depends(get_db)
):
    try:
        user = user_crud.validate_reset_token(db, reset_data.reset_token)
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        # Update the user's password
        user_crud.reset_password(db, reset_data.reset_token, reset_data.new_password)
        
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

### Change Password ###
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

    user_crud.update_user_password(db, current_user.id, password_data.old_password,password_data.new_password)
    
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