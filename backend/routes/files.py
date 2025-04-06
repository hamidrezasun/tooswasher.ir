from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse as FastAPIFileResponse
from typing import List
from datetime import datetime
import os
import schemas.file as file_schemas
import schemas.user as user_schemas
import auth
from models.user import RoleEnum
from crud.file import create_file, get_file, get_all_files, delete_file
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/files",
    tags=["files"]
)

# Upload File Endpoint
@router.post("/upload/", response_model=file_schemas.FileResponse)
async def upload_file_endpoint(
    file: UploadFile = File(...),
    public: bool = False,
    current_user: user_schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check permissions
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can upload files."
        )
    
    # Read file content
    file_content = await file.read()
    
    # Create file record
    db_file = create_file(
        db=db,
        original_filename=file.filename,
        content_type=file.content_type,
        file_content=file_content,
        user_id=current_user.id,
        is_public=public
    )
    
    return file_schemas.FileResponse(
        id=db_file.id,
        filename=db_file.filename,
        original_filename=db_file.original_filename,
        content_type=db_file.content_type,
        size=db_file.size,
        public=db_file.public,
        upload_date=db_file.upload_date,
        user_id=db_file.user_id,
        download_url=f"/files/download/{db_file.id}"
    )

# Download File Endpoint
@router.get("/download/{file_id}")
async def download_file_endpoint(
    file_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    file = get_file(db, file_id)
    
    # Check permissions
    if not file.public and (not current_user or current_user.role not in [RoleEnum.admin, RoleEnum.staff]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this file"
        )
    
    if not os.path.exists(file.path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )
    
    return FastAPIFileResponse(
        path=file.path,
        filename=file.original_filename,
        media_type=file.content_type
    )

# List Files Endpoint (Admin only)
@router.get("/", response_model=file_schemas.FileListResponse)
async def list_files_endpoint(
    current_user: user_schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can list all files"
        )
    
    files = get_all_files(db)
    return file_schemas.FileListResponse(files=files)