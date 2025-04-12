from sqlalchemy.orm import Session
from models.file import FileUpload
from models.user import User
import schemas.file as file_schemas
from fastapi import HTTPException, status
import os
import uuid
from typing import List
from PIL import Image
from io import BytesIO
import imghdr

def save_file_to_disk(file_path: str, file_content: bytes):
    """Helper function to save file to disk"""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

def optimize_image_content(
    file_content: bytes,
    max_size: tuple = (1600, 1600),
    quality: int = 80
) -> tuple[bytes, str, str]:
    """
    Optimize image content for web use.
    
    Args:
        file_content: Original image bytes
        max_size: Maximum dimensions (width, height)
        quality: Quality setting (1-100)
    
    Returns:
        tuple: (optimized_bytes, new_content_type, new_extension)
    """
    try:
        with Image.open(BytesIO(file_content)) as img:
            # Determine output format - use WebP unless it's a PNG with transparency
            output_format = "WEBP"
            if img.mode == 'RGBA':
                output_format = "PNG"
            
            # Convert to RGB if needed for JPEG/WEBP
            if output_format in ['JPEG', 'WEBP'] and img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Resize while maintaining aspect ratio
            img.thumbnail(max_size, Image.LANCZOS)
            
            # Save to bytes buffer with optimization
            output_buffer = BytesIO()
            
            if output_format == 'PNG':
                img.save(output_buffer, format=output_format, optimize=True, compress_level=9)
            else:
                img.save(output_buffer, format=output_format, quality=quality, optimize=True)
            
            new_content_type = f"image/{output_format.lower()}"
            new_extension = output_format.lower()
            
            return output_buffer.getvalue(), new_content_type, new_extension
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image optimization failed: {str(e)}"
        )

def create_file(
    db: Session,
    original_filename: str,
    content_type: str,
    file_content: bytes,
    user_id: int,
    is_public: bool = False,
    upload_dir: str = "uploads",
    optimize_images: bool = True
) -> FileUpload:
    """Create a new file record in database with optional image optimization"""
    # Initialize variables that might change for images
    final_content = file_content
    final_content_type = content_type
    final_extension = original_filename.split(".")[-1] if "." in original_filename else ""
    
    # Optimize if it's an image and optimization is enabled
    if optimize_images and content_type.startswith('image/'):
        try:
            # Verify it's actually an image file
            image_type = imghdr.what(None, h=file_content)
            if image_type:
                optimized_content, new_content_type, new_extension = optimize_image_content(file_content)
                final_content = optimized_content
                final_content_type = new_content_type
                final_extension = new_extension
        except HTTPException:
            # If optimization fails, proceed with original file
            pass
    
    # Generate unique filename with proper extension
    unique_filename = f"{uuid.uuid4()}.{final_extension}" if final_extension else str(uuid.uuid4())
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file to disk
    save_file_to_disk(file_path, final_content)
    
    # Create database record
    db_file = FileUpload(
        filename=unique_filename,
        original_filename=original_filename,
        content_type=final_content_type,
        size=len(final_content),
        path=file_path,
        user_id=user_id,
        public=is_public
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return db_file

# The rest of your functions remain unchanged
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
    """Get all public files (admin only)"""
    return db.query(FileUpload)\
            .filter(FileUpload.public == True)\
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