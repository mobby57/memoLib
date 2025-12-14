# -*- coding: utf-8 -*-
from minio import Minio
import os
import logging

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        endpoint = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
        access_key = os.getenv('MINIO_ACCESS_KEY', 'minio')
        secret_key = os.getenv('MINIO_SECRET_KEY', 'minio123')
        self.bucket = os.getenv('MINIO_BUCKET', 'uploads')
        
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=False
        )
        
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)
    
    def upload_file(self, file_data, filename, content_type='application/octet-stream'):
        try:
            temp_path = f"/tmp/{filename}"
            with open(temp_path, 'wb') as f:
                f.write(file_data)
            
            self.client.fput_object(self.bucket, filename, temp_path, content_type=content_type)
            url = f"http://{os.getenv('MINIO_ENDPOINT', 'localhost:9000')}/{self.bucket}/{filename}"
            os.remove(temp_path)
            return url
        except Exception as e:
            logger.error(f"Erreur upload: {type(e).__name__}")
            return None
    
    def get_file_url(self, filename):
        return f"http://{os.getenv('MINIO_ENDPOINT', 'localhost:9000')}/{self.bucket}/{filename}"

# Fonction standalone pour compatibilite
def upload_file(file, object_name):
    """Upload fichier vers stockage local"""
    os.makedirs('data/uploads', exist_ok=True)
    filepath = os.path.join('data/uploads', object_name.replace('/', '_'))
    file.save(filepath)
    return f"/uploads/{object_name.replace('/', '_')}"
