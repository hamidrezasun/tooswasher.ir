# routers/page.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import crud.page as page_crud
import schemas.page as page_schemas
import schemas.user as user_schemas
import auth
from database import get_db

router = APIRouter(
    prefix="/pages",
    tags=["pages"]
)

@router.post(
    "/",
    response_model=page_schemas.Page,
    status_code=status.HTTP_200_OK,
    summary="Create Page",
)
def create_page(
    page: page_schemas.PageCreate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new page (admin only)."""
    return page_crud.create_page(db=db, page=page)

@router.get(
    "/",
    response_model=List[page_schemas.PageBase],
    status_code=status.HTTP_200_OK,
    summary="Read Pages",
)
def read_pages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Retrieve a list of pages."""
    pages = page_crud.get_pages(db, skip=skip, limit=limit)
    return pages

@router.get(
    "/{page_id}",
    response_model=page_schemas.Page,
    status_code=status.HTTP_200_OK,
    summary="Read Page",
)
def read_page(
    page_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve a specific page by ID."""
    page = page_crud.get_page(db, page_id=page_id)
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.put(
    "/{page_id}",
    response_model=page_schemas.Page,
    status_code=status.HTTP_200_OK,
    summary="Update Page",
)
def update_page(
    page_id: int,
    page: page_schemas.PageUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update an existing page (admin only)."""
    updated_page = page_crud.update_page(db, page_id=page_id, page=page)
    if updated_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return updated_page

@router.delete(
    "/{page_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Page",
)
def delete_page(
    page_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a page (admin only)."""
    deleted_page = page_crud.delete_page(db, page_id=page_id)
    if deleted_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return None

@router.get(
    "/search/",
    response_model=List[page_schemas.PageBase],
    status_code=status.HTTP_200_OK,
    summary="Search Pages by Name",
)
def search_pages(
    query: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Search pages by name."""
    pages = page_crud.search_pages_by_name(db, query=query, skip=skip, limit=limit)
    return pages