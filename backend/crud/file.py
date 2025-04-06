from sqlalchemy.orm import Session
from models.file import FileUpload
from models.user import User
import schemas.file as file_schemas
from fastapi import HTTPException, status
import os
import uuid
from typing import List

def save_file_to_disk(file_path: str, file_content: bytes):
    """Helper function to save file to disk"""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

def create_file(
    db: Session,
    original_filename: str,
    content_type: str,
    file_content: bytes,
    user_id: int,
    is_public: bool = False,
    upload_dir: str = "uploads"
) -> FileUpload:
    """Create a new file record in database"""
    # Generate unique filename
    file_ext = original_filename.split(".")[-1] if "." in original_filename else ""
    unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file to disk
    save_file_to_disk(file_path, file_content)
    
    # Create database record
    db_file = FileUpload(
        filename=unique_filename,
        original_filename=original_filename,
        content_type=content_type,
        size=len(file_content),
        path=file_path,
        user_id=user_id,
        public=is_public
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return db_file

def get_file(db: Session, file_id: int) -> FileUpload:
    """Get a single file by ID"""
    file = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return file

def get_all_files(db: Session, skip: int = 0, limit: int = 100) -> List[FileUpload]:
    """Get all files (admin only)"""
    return db.query(FileUpload)\
            .offset(skip)\
            .limit(limit)\
            .all()

def delete_file(db: Session, file_id: int):
    """Delete a file record and the physical file"""
    file = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Delete physical file if it exists
    if file.path and os.path.exists(file.path):
        os.remove(file.path)
    
    db.delete(file)
    db.commit()
    return file