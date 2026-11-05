import os
import shutil
from pathlib import Path
from typing import Optional
from datetime import datetime
import uuid

# Local storage (for development)
class LocalStorageService:
    def __init__(self, base_path: str = "./storage"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True, parents=True)
    
    async def upload(self, file_bytes: bytes, filename: str, content_type: str = "image/png") -> str:
        """Upload file to local storage"""
        # Create full path
        file_path = self.base_path / filename
        
        # Create directory if not exists
        file_path.parent.mkdir(exist_ok=True, parents=True)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        
        # Return URL (for local development)
        return f"/storage/{filename}"
    
    async def get(self, filename: str) -> Optional[bytes]:
        """Get file from storage"""
        file_path = self.base_path / filename
        if file_path.exists():
            with open(file_path, "rb") as f:
                return f.read()
        return None
    
    async def delete(self, filename: str) -> bool:
        """Delete file from storage"""
        file_path = self.base_path / filename
        if file_path.exists():
            file_path.unlink()
            return True
        return False

# For S3/Cloud storage (production)
class S3StorageService:
    def __init__(self, bucket_name: str, region: str = "ap-south-1"):
        try:
            import boto3
            self.s3 = boto3.client('s3', region_name=region)
            self.bucket_name = bucket_name
            self.s3_enabled = True
        except ImportError:
            print("⚠️ boto3 not installed. Using local storage.")
            self.s3_enabled = False
            self.local_storage = LocalStorageService()
    
    async def upload(self, file_bytes: bytes, filename: str, content_type: str = "image/png") -> str:
        """Upload to S3"""
        if not self.s3_enabled:
            return await self.local_storage.upload(file_bytes, filename, content_type)
        
        try:
            self.s3.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=file_bytes,
                ContentType=content_type
            )
            return f"https://{self.bucket_name}.s3.amazonaws.com/{filename}"
        except Exception as e:
            print(f"S3 upload failed: {e}")
            return await self.local_storage.upload(file_bytes, filename, content_type)
    
    async def get(self, filename: str) -> Optional[bytes]:
        """Get from S3"""
        if not self.s3_enabled:
            return await self.local_storage.get(filename)
        
        try:
            response = self.s3.get_object(Bucket=self.bucket_name, Key=filename)
            return response['Body'].read()
        except Exception:
            return await self.local_storage.get(filename)

# Create storage service instance
# Use local storage for development (no AWS credentials needed)
storage_service = LocalStorageService()

# If you want to use S3, uncomment and set credentials:
# storage_service = S3StorageService(
#     bucket_name="your-bucket-name",
#     region="ap-south-1"
# )
