"""
API REST Blueprint pour IA Poste Manager v4.0

Architecture séparée Frontend/Backend.
Ce module expose des endpoints JSON pour consommation par frontend React/mobile.
"""

from flask import Blueprint, jsonify
from datetime import datetime

# Création du Blueprint API
api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint pour monitoring"""
    return jsonify({
        'status': 'healthy',
        'version': '4.0',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# Import des routes
from src.backend.api import routes

__all__ = ['api_bp']
