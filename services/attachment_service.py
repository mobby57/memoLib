# Service gestion pieces jointes
import os
from werkzeug.utils import secure_filename
from services.storage_service import upload_file

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'zip'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_attachment(file, user_id):
    """Sauvegarde piece jointe et retourne URL"""
    if not file or not allowed_file(file.filename):
        raise ValueError("Type de fichier non autorise")
    
    if file.content_length and file.content_length > MAX_FILE_SIZE:
        raise ValueError("Fichier trop volumineux (max 10MB)")
    
    filename = secure_filename(file.filename)
    object_name = f"attachments/{user_id}/{filename}"
    
    url = upload_file(file, object_name)
    return {
        'filename': filename,
        'url': url,
        'size': file.content_length or 0
    }

def get_attachments(workflow_id):
    """Recupere pieces jointes d'un workflow"""
    import json
    path = f"data/attachments/{workflow_id}.json"
    if not os.path.exists(path):
        return []
    with open(path, 'r') as f:
        return json.load(f)

def save_attachments_metadata(workflow_id, attachments):
    """Sauvegarde metadata pieces jointes"""
    import json
    os.makedirs("data/attachments", exist_ok=True)
    path = f"data/attachments/{workflow_id}.json"
    with open(path, 'w') as f:
        json.dump(attachments, f, indent=2)
