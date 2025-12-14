# Script backup automatique S3
import boto3
import os
from datetime import datetime
import json

def backup_to_s3():
    s3 = boto3.client('s3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    bucket = os.getenv('BACKUP_BUCKET', 'securevault-backups')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Backup data
    files = [
        'data/workflow_history.json',
        'data/signatures.json',
        'recipients.json',
        'users.json'
    ]
    
    for file in files:
        if os.path.exists(file):
            key = f"backups/{timestamp}/{file}"
            s3.upload_file(file, bucket, key)
            print(f"OK Backup {file} -> s3://{bucket}/{key}")
    
    # Metadata
    metadata = {
        'timestamp': timestamp,
        'files': files,
        'version': '2.1.0'
    }
    
    s3.put_object(
        Bucket=bucket,
        Key=f"backups/{timestamp}/metadata.json",
        Body=json.dumps(metadata)
    )
    
    print(f"OK Backup complet: {timestamp}")

if __name__ == '__main__':
    backup_to_s3()
