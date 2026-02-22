"""
File storage utilities for handling image uploads.
Supports local filesystem, AWS S3, and Cloudinary.
"""
import os
import uuid
from typing import Optional
from pathlib import Path
from fastapi import UploadFile, HTTPException

from app.config import settings


def validate_image_file(file: UploadFile) -> None:
    """
    Validate uploaded image file.
    
    Args:
        file: Uploaded file from FastAPI
        
    Raises:
        HTTPException: If file is invalid
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
        )


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate a unique filename using UUID.
    
    Args:
        original_filename: Original filename from upload
        
    Returns:
        Unique filename with preserved extension
    """
    file_ext = Path(original_filename).suffix.lower()
    unique_id = uuid.uuid4().hex
    return f"{unique_id}{file_ext}"


async def save_upload_file_local(file: UploadFile, subfolder: str = "products") -> str:
    """
    Save uploaded file to local filesystem.
    
    Args:
        file: Uploaded file from FastAPI
        subfolder: Subfolder within upload directory
        
    Returns:
        Relative file path (URL path)
    """
    validate_image_file(file)
    
    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    filename = generate_unique_filename(file.filename)
    file_path = upload_dir / filename
    
    contents = await file.read()
    
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    return f"/{settings.UPLOAD_DIR}/{subfolder}/{filename}"


async def save_upload_file(file: UploadFile, subfolder: str = "products") -> str:
    """
    Save uploaded file using configured storage backend.
    
    Args:
        file: Uploaded file from FastAPI
        subfolder: Subfolder/prefix for organization
        
    Returns:
        File URL (either relative path or full CDN URL)
    """
    storage_type = settings.STORAGE_TYPE.lower()
    
    if storage_type == "local":
        return await save_upload_file_local(file, subfolder)
    elif storage_type == "s3":
        return await save_upload_file_s3(file, subfolder)
    elif storage_type == "cloudinary":
        return await save_upload_file_cloudinary(file, subfolder)
    else:
        raise ValueError(f"Unsupported storage type: {storage_type}")


async def save_upload_file_s3(file: UploadFile, subfolder: str = "products") -> str:
    """
    Save uploaded file to AWS S3.
    
    Args:
        file: Uploaded file from FastAPI
        subfolder: S3 key prefix
        
    Returns:
        Full S3 URL to uploaded file
    """
    validate_image_file(file)
    
    try:
        import boto3
        from botocore.exceptions import ClientError
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="boto3 not installed. Install with: pip install boto3"
        )
    
    if not all([settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY, settings.AWS_S3_BUCKET]):
        raise HTTPException(status_code=500, detail="S3 configuration incomplete")
    
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    
    filename = generate_unique_filename(file.filename)
    s3_key = f"{subfolder}/{filename}"
    
    contents = await file.read()
    
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    try:
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=s3_key,
            Body=contents,
            ContentType=file.content_type
        )
        
        url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
        return url
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")


async def save_upload_file_cloudinary(file: UploadFile, subfolder: str = "products") -> str:
    """
    Save uploaded file to Cloudinary.
    
    Args:
        file: Uploaded file from FastAPI
        subfolder: Cloudinary folder
        
    Returns:
        Full Cloudinary URL to uploaded file
    """
    validate_image_file(file)
    
    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="cloudinary not installed. Install with: pip install cloudinary"
        )
    
    if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
        raise HTTPException(status_code=500, detail="Cloudinary configuration incomplete")
    
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET
    )
    
    contents = await file.read()
    
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    try:
        result = cloudinary.uploader.upload(
            contents,
            folder=subfolder,
            resource_type="image"
        )
        return result['secure_url']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to Cloudinary: {str(e)}")
