from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class FileUpload(Base):
    __tablename__ = "file_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)  # Store original filename
    content_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)  # File size in bytes
    path = Column(String(512), nullable=False)  # Path in filesystem/storage
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    public = Column(Boolean, default=False)  # Simple permission flag
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])