from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import crud.option as option_crud
import schemas.option as option_schemas
from database import get_db
from models.user import User
import schemas.user as user_schemas
import auth

router = APIRouter(
    prefix="/options",
    tags=["options"],
)

@router.post(
    "/",
    response_model=option_schemas.Option,
    status_code=status.HTTP_200_OK,
    summary="Create Option",
)
def create_option(
    option: option_schemas.OptionCreate,
    current_user: User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new option (admin only)."""
    return option_crud.create_option(db=db, option_data=option)

@router.get(
    "/",
    response_model=List[option_schemas.Option],
    status_code=status.HTTP_200_OK,
    summary="Read Options",
)
def read_options(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Retrieve a list of options."""
    options = option_crud.get_options(db, skip=skip, limit=limit)
    return options

@router.get(
    "/{option_id}",
    response_model=option_schemas.Option,
    status_code=status.HTTP_200_OK,
    summary="Read Option",
)
def read_option(
    option_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve a specific option by ID."""
    option = option_crud.get_option(db, option_id=option_id)
    if option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    return option

@router.put(
    "/{option_id}",
    response_model=option_schemas.Option,
    status_code=status.HTTP_200_OK,
    summary="Update Option",
)
def update_option(
    option_id: int,
    option: option_schemas.OptionUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update an existing option (admin only)."""
    updated_option = option_crud.update_option(db, option_id=option_id, option_data=option)
    if updated_option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    return updated_option

@router.delete(
    "/{option_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Option",
)
def delete_option(
    option_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete an option (admin only)."""
    deleted_option = option_crud.delete_option(db, option_id=option_id)
    if deleted_option is None:
        raise HTTPException(status_code=404, detail="Option not found")
    return None

@router.get(
    "/by-name/{option_name}",
    response_model=option_schemas.Option,
    status_code=status.HTTP_200_OK,
    summary="Search Options by Name",
)
def read_option_by_name(
    option_name: str,
    db: Session = Depends(get_db),
):
    """Retrieve a specific option by name."""
    option = option_crud.get_option_by_name(db, option_name=option_name)
    return option
