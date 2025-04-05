from pydantic import BaseModel
from typing import List
from datetime import datetime

# Request schema for file upload
class FileUploadRequest(BaseModel):
    custom_name: str
    permission: List[int]  # List of user IDs who can access the file

# Response schema for file metadata
class FileResponse(BaseModel):
    file_name: str
    file_size: int
    file_type: str
    file_url: str
    file_permission: List[int]
    upload_date: str

# Response schema for listing files
class FileListResponse(BaseModel):
    files: List[FileResponse]