"""API v1 Blueprint"""
from flask import Blueprint, jsonify, request
import logging

logger = logging.getLogger(__name__)

# Créer le blueprint
api_v1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')

@api_v1.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': '2024-01-01T00:00:00Z'
    })

@api_v1.route('/info', methods=['GET'])
def api_info():
    """Informations sur l'API"""
    return jsonify({
        'name': 'IAPosteManager API',
        'version': '1.0.0',
        'description': 'API pour l\'automatisation d\'emails avec IA',
        'endpoints': [
            '/api/v1/health',
            '/api/v1/info',
            '/api/v1/emails',
            '/api/v1/templates'
        ]
    })

@api_v1.route('/emails', methods=['GET', 'POST'])
def emails_endpoint():
    """Endpoint pour les emails"""
    if request.method == 'GET':
        return jsonify({
            'emails': [],
            'total': 0,
            'message': 'Endpoint emails GET'
        })
    
    elif request.method == 'POST':
        data = request.get_json() or {}
        return jsonify({
            'success': True,
            'message': 'Email traité',
            'data': data
        })

@api_v1.route('/templates', methods=['GET', 'POST'])
def templates_endpoint():
    """Endpoint pour les templates"""
    if request.method == 'GET':
        return jsonify({
            'templates': [],
            'total': 0,
            'message': 'Endpoint templates GET'
        })
    
    elif request.method == 'POST':
        data = request.get_json() or {}
        return jsonify({
            'success': True,
            'message': 'Template traité',
            'data': data
        })

@api_v1.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint non trouvé',
        'message': 'L\'endpoint demandé n\'existe pas dans l\'API v1'
    }), 404

@api_v1.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Erreur interne',
        'message': 'Une erreur interne s\'est produite'
    }), 500