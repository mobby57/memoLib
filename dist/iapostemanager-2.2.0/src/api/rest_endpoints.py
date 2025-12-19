from flask import Blueprint, request, jsonify
from functools import wraps

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Token required'}), 401
        return f(*args, **kwargs)
    return decorated

@api_bp.route('/emails', methods=['POST'])
@require_auth
def send_email_api():
    data = request.get_json()
    return jsonify({'success': True, 'id': 1})

@api_bp.route('/emails/<int:email_id>', methods=['GET'])
@require_auth
def get_email(email_id):
    return jsonify({'id': email_id, 'status': 'sent'})

@api_bp.route('/templates', methods=['GET', 'POST'])
@require_auth
def templates_api():
    if request.method == 'GET':
        return jsonify({'templates': []})
    return jsonify({'success': True})

@api_bp.route('/analytics/stats', methods=['GET'])
@require_auth
def analytics_stats():
    return jsonify({
        'emails_sent': 100,
        'ai_generations': 50,
        'success_rate': 95.5
    })