# services/nextcloud.py
import httpx
import os
from datetime import datetime
from typing import Dict, List, Optional

# Nextcloud Configuration
NEXTCLOUD_URL = "https://file.tooswasher.com"  # Replace with your Nextcloud URL
NEXTCLOUD_USERNAME = "admin"  # Replace with your Nextcloud username
NEXTCLOUD_PASSWORD = "esp8266/32lumk59PZMW@"  # Use an App Password for better security

# Helper function to handle duplicate filenames
def get_unique_filename(file_path: str) -> str:
    """
    Check if a file already exists in Nextcloud and return a unique filename.
    """
    counter = 1
    original_name, extension = os.path.splitext(file_path)
    unique_name = file_path

    while True:
        # Check if the file exists
        response = httpx.get(
            f"{NEXTCLOUD_URL}/remote.php/dav/files/{NEXTCLOUD_USERNAME}/{unique_name}",
            auth=(NEXTCLOUD_USERNAME, NEXTCLOUD_PASSWORD),
        )
        if response.status_code == 404:  # File does not exist
            break
        # Append a counter to the filename
        unique_name = f"{original_name} ({counter}){extension}"
        counter += 1

    return unique_name

# Helper function to get file metadata
def get_file_metadata(file_name: str) -> Optional[Dict]:
    """
    Get metadata (size, type, URL, permissions) for a file in Nextcloud.
    """
    file_url = f"{NEXTCLOUD_URL}/remote.php/dav/files/{NEXTCLOUD_USERNAME}/{file_name}"
    response = httpx.get(file_url, auth=(NEXTCLOUD_USERNAME, NEXTCLOUD_PASSWORD))
    if response.status_code == 200:
        # Extract permissions from the filename (assuming format: {customname}-{permission}-{date}-{filename})
        parts = file_name.split("-")
        custom_name = parts[0]
        permission_str = parts[1]
        file_permission = list(map(int, permission_str.split("_"))) if permission_str != "public" else []
        
        return {
            "file_name": file_name,
            "file_size": int(response.headers.get("Content-Length", 0)),
            "file_type": response.headers.get("Content-Type", "application/octet-stream"),
            "file_url": file_url,
            "file_permission": file_permission,
        }
    return None

# Upload a file to Nextcloud
async def upload_file(
    file: bytes,
    file_name: str,
    content_type: str,
    custom_name: str,
    file_permission: List[int],
) -> Dict:
    """
    Upload a file to Nextcloud with a formatted filename and permissions.
    Format: {customname}-{permission}-{upload date}-{filename}
    """
    # Format the filename
    upload_date = datetime.now().strftime("%Y%m%d")
    permission_str = "_".join(map(str, file_permission)) if file_permission else "public"
    formatted_name = f"{custom_name}-{permission_str}-{upload_date}-{file_name}"
    
    # Ensure the filename is unique
    unique_name = get_unique_filename(formatted_name)
    
    # Upload the file
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"{NEXTCLOUD_URL}/remote.php/dav/files/{NEXTCLOUD_USERNAME}/{unique_name}",
            content=file,
            auth=(NEXTCLOUD_USERNAME, NEXTCLOUD_PASSWORD),
            headers={"Content-Type": content_type},
        )
        if response.status_code != 201:
            raise Exception("Failed to upload file")
    
    # Return file metadata including permission
    metadata = get_file_metadata(unique_name)
    return metadata

# Download a file from Nextcloud
async def download_file(file_name: str, user_id: int = 0) -> bytes:
    """
    Download a file from Nextcloud after validating permissions.
    """
    # Get file metadata (including permission)
    metadata = get_file_metadata(file_name)
    if not metadata:
        raise Exception("File not found")
    
    # Check permissions
    file_permission = metadata.get("file_permission", [])
    if file_permission and user_id not in file_permission:
        raise Exception("Unauthorized access")
    
    # Download the file
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{NEXTCLOUD_URL}/remote.php/dav/files/{NEXTCLOUD_USERNAME}/{file_name}",
            auth=(NEXTCLOUD_USERNAME, NEXTCLOUD_PASSWORD),
        )
        if response.status_code != 200:
            raise Exception("Failed to download file")
    
    return response.content

# List all files in Nextcloud
async def list_files() -> List[Dict]:
    """
    List all files in the Nextcloud directory.
    """
    async with httpx.AsyncClient() as client:
        response = await client.request(
            "PROPFIND",
            f"{NEXTCLOUD_URL}/remote.php/dav/files/{NEXTCLOUD_USERNAME}/",
            auth=(NEXTCLOUD_USERNAME, NEXTCLOUD_PASSWORD),
            headers={"Depth": "1"},
        )
        if response.status_code != 207:
            raise Exception("Failed to list files")
        
        # Parse the XML response to extract file names
        files = []
        for item in response.text.split("<d:response>"):
            if "<d:href>" in item:
                file_name = item.split("<d:href>")[1].split("</d:href>")[0]
                file_name = file_name.split(f"/remote.php/dav/files/{NEXTCLOUD_USERNAME}/")[-1]
                if file_name:  # Skip the root directory
                    metadata = get_file_metadata(file_name)
                    if metadata:
                        files.append(metadata)
        return files
