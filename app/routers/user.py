from fastapi import APIRouter, HTTPException
from app.models.user import users_db, User
from app.schemas.user import UserCreate, UserResponse
from typing import List

router = APIRouter(prefix="/api/users", tags=["users"])

# Create a new user
@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate):
    new_user = User(id=len(users_db) + 1, username=user.username, email=user.email)
    users_db.append(new_user)
    return new_user

# Get all users
@router.get("/", response_model=List[UserResponse])
def get_users():
    return users_db

# Get a single user by ID
@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    for user in users_db:
        if user.id == user_id:
            return user
    raise HTTPException(status_code=404, detail="User not found")

# Update a user by ID
@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, updated_user: UserCreate):
    for index, user in enumerate(users_db):
        if user.id == user_id:
            users_db[index] = User(id=user_id, username=updated_user.username, email=updated_user.email)
            return users_db[index]
    raise HTTPException(status_code=404, detail="User not found")

# Delete a user by ID
@router.delete("/{user_id}")
def delete_user(user_id: int):
    for index, user in enumerate(users_db):
        if user.id == user_id:
            users_db.pop(index)
            return {"message": "User deleted successfully"}
    raise HTTPException(status_code=404, detail="User not found")