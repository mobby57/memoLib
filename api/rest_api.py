# API REST v1
from flask import Blueprint, request, jsonify
from functools import wraps
import jwt
import os
from datetime import datetime, timedelta

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

SECRET_KEY = os.getenv('API_SECRET_KEY', 'change-me-in-production')

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token manquant'}), 401
        try:
            jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        except:
            return jsonify({'error': 'Token invalide'}), 401
        return f(*args, **kwargs)
    return decorated

@api_bp.route('/auth/token', methods=['POST'])
def get_token():
    """Genere token API"""
    data = request.json
    api_key = data.get('api_key')
    
    if api_key != os.getenv('API_KEY'):
        return jsonify({'error': 'API key invalide'}), 401
    
    token = jwt.encode({
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, SECRET_KEY, algorithm='HS256')
    
    return jsonify({'token': token})

@api_bp.route('/emails/send', methods=['POST'])
@require_api_key
def send_email_api():
    """Envoie email via API"""
    from services.email_service import send_email
    
    data = request.json
    result = send_email(
        data['to'],
        data['subject'],
        data['body'],
        data.get('cc'),
        data.get('bcc')
    )
    
    return jsonify({'success': True, 'message_id': result})

@api_bp.route('/emails/generate', methods=['POST'])
@require_api_key
def generate_email_api():
    """Genere email via API"""
    from services.ai_generator import generate_email
    
    data = request.json
    email = generate_email(data['context'], data.get('tone', 'professionnel'))
    
    return jsonify({'success': True, 'email': email})

@api_bp.route('/workflows', methods=['GET'])
@require_api_key
def list_workflows_api():
    """Liste workflows via API"""
    from models.workflow_manager import get_all_workflows
    
    workflows = get_all_workflows()
    return jsonify({'success': True, 'workflows': workflows})

@api_bp.route('/workflows/<workflow_id>', methods=['GET'])
@require_api_key
def get_workflow_api(workflow_id):
    """Recupere workflow via API"""
    from models.workflow_manager import get_workflow
    
    workflow = get_workflow(workflow_id)
    if not workflow:
        return jsonify({'error': 'Workflow non trouve'}), 404
    
    return jsonify({'success': True, 'workflow': workflow})
