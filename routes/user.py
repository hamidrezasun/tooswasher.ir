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