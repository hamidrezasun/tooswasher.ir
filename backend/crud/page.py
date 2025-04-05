# crud/page.py
from sqlalchemy.orm import Session
from models.page import Page
import schemas.page as page_schemas
from fastapi import HTTPException, status

def create_page(db: Session, page: page_schemas.PageCreate):
    """Create a new page, enforcing unique name constraint."""
    existing_page = db.query(Page).filter(Page.name == page.name).first()
    if existing_page:
        raise HTTPException(status_code=400, detail="Page with this name already exists")
    db_page = Page(**page.dict())  # Includes name, body, is_in_menu
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

def get_page(db: Session, page_id: int):
    """Retrieve a page by ID."""
    return db.query(Page).filter(Page.id == page_id).first()

def get_pages(db: Session, skip: int = 0, limit: int = 100):
    """Retrieve a list of pages with pagination."""
    return db.query(Page).offset(skip).limit(limit).all()

def update_page(db: Session, page_id: int, page: page_schemas.PageUpdate):
    """Update an existing page, enforcing unique name constraint."""
    db_page = db.query(Page).filter(Page.id == page_id).first()
    if not db_page:
        return None
    # Check for duplicate name if name is being updated
    if page.name and page.name != db_page.name:
        existing_page = db.query(Page).filter(Page.name == page.name).first()
        if existing_page:
            raise HTTPException(status_code=400, detail="Page with this name already exists")
    
    update_data = page.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_page, key, value)
    db.commit()
    db.refresh(db_page)
    return db_page

def delete_page(db: Session, page_id: int):
    """Delete a page by ID."""
    db_page = db.query(Page).filter(Page.id == page_id).first()
    if not db_page:
        return None
    db.delete(db_page)
    db.commit()
    return None  # Explicitly return None for 204 No 

def search_pages_by_name(db: Session, query: str, skip: int = 0, limit: int = 100):
    """Search pages by name."""
    return db.query(Page).filter(
        Page.name.ilike(f"%{query}%")  # Case-insensitive search
    ).offset(skip).limit(limit).all()