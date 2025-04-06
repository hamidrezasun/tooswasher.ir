from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class RoleEnum(str, Enum):
    admin = "admin"
    staff = "staff"
    user = "user"

class FileBase(BaseModel):
    filename: str
    original_filename: str
    content_type: str
    size: int
    public: bool

class FileCreate(FileBase):
    pass

class FileResponse(FileBase):
    id: int
    upload_date: datetime
    user_id: int
    download_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class FileListResponse(BaseModel):
    files: list[FileResponse]