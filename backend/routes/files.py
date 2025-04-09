from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Request
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
    request: Request,  # Use Request to get base URL
    file: UploadFile = File(...),
    public: bool = False,
    current_user: user_schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [RoleEnum.admin, RoleEnum.staff]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can upload files."
        )
    
    file_content = await file.read()
    
    db_file = create_file(
        db=db,
        original_filename=file.filename,
        content_type=file.content_type,
        file_content=file_content,
        user_id=current_user.id,
        is_public=public
    )
    
    # Construct the base URL dynamically from the request, including /api prefix
    base_url = f"{request.url.scheme}://{request.url.hostname}/api"
    download_url = f"{base_url}/files/download/{db_file.id}"
    
    return file_schemas.FileResponse(
        id=db_file.id,
        filename=db_file.filename,
        original_filename=db_file.original_filename,
        content_type=db_file.content_type,
        size=db_file.size,
        public=db_file.public,
        upload_date=db_file.upload_date,
        user_id=db_file.user_id,
        download_url=download_url
    )

# Download File Endpoint
@router.get("/download/{file_id}")
async def download_file_endpoint(
    file_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    file = get_file(db, file_id)
    
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
    request: Request,  # Use Request to get base URL
    current_user: user_schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can list all files"
        )
    
    files = get_all_files(db, skip=skip, limit=limit)
    # Construct the base URL dynamically from the request, including /api prefix
    base_url = f"{request.url.scheme}://{request.url.hostname}/api"
    file_responses = [
        file_schemas.FileResponse(
            id=f.id,
            filename=f.filename,
            original_filename=f.original_filename,
            content_type=f.content_type,
            size=f.size,
            public=f.public,
            upload_date=f.upload_date,
            user_id=f.user_id,
            download_url=f"{base_url}/files/download/{f.id}"
        ) for f in files
    ]
    return file_schemas.FileListResponse(files=file_responses)

# Delete File Endpoint (Admin and file owner only)
@router.delete("/{file_id}", response_model=file_schemas.FileResponse)
async def delete_file_endpoint(
    file_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    file = get_file(db, file_id)
    
    # Check permissions: only admin or file owner can delete
    if current_user.role != RoleEnum.admin and current_user.id != file.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this file"
        )
    
    # Delete the file using CRUD function
    deleted_file = delete_file(db, file_id)
    
    # Return the deleted file info
    return file_schemas.FileResponse(
        id=deleted_file.id,
        filename=deleted_file.filename,
        original_filename=deleted_file.original_filename,
        content_type=deleted_file.content_type,
        size=deleted_file.size,
        public=deleted_file.public,
        upload_date=deleted_file.upload_date,
        user_id=deleted_file.user_id,
        download_url=None  # Set to None since file is deleted
    )