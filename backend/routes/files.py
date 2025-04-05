from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import List
from datetime import datetime
from services.nextcloud import upload_file, download_file, list_files
from schemas.files import FileUploadRequest, FileResponse, FileListResponse
import schemas.user as user_schemas
import auth

router = APIRouter(
    prefix="/files",
    tags=["files"]
)
# Upload File Endpoint
@router.post("/upload/", response_model=FileResponse)
async def upload_file_endpoint(
    custom_name: str,
    permission: List[int],
    file: UploadFile = File(...),
    current_user: user_schemas.User =  Depends(auth.get_current_user_optional)
):
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin or staff can upload files.")
    
    # Read file content
    file_content = await file.read()
    
    # Upload file to Nextcloud
    try:
        metadata = await upload_file(
            file=file_content,
            file_name=file.filename,
            content_type=file.content_type,
            custom_name=custom_name,
            file_permission=permission,
        )
        return FileResponse(
            file_name=metadata["file_name"],
            file_size=metadata["file_size"],
            file_type=metadata["file_type"],
            file_url=metadata["file_url"],
            file_permission=metadata["file_permission"],
            upload_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Download File Endpoint
@router.get("/download/{file_name}")
async def download_file_endpoint(file_name: str, user_id: int = 0):
    try:
        file_content = await download_file(file_name, user_id)
        return {"file_content": file_content}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# List Files Endpoint
@router.get("/files/", response_model=FileListResponse)
async def list_files_endpoint():
    try:
        files = await list_files()
        return FileListResponse(files=files)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))