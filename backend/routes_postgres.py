"""
API Routes - Version PostgreSQL
Utilise les services PostgreSQL au lieu de l'ancien système JSON/SQLAlchemy
"""
from flask import Blueprint, request, jsonify
from functools import wraps
import logging

# Import des services PostgreSQL
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))

from services.workspace_service_postgres import get_workspace_service
from services.user_service_postgres import get_user_service
from services.database_service import get_database_service

logger = logging.getLogger(__name__)

# Blueprint API
api_v2 = Blueprint('api_v2', __name__, url_prefix='/api/v2')

# Services
workspace_service = get_workspace_service()
user_service = get_user_service()
db_service = get_database_service()


# ============================================================
# MIDDLEWARE - AUTH
# ============================================================

def token_required(f):
    """Décorateur pour vérifier le JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Token dans header Authorization: Bearer <token>
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Vérifier le token
            current_user = user_service.verify_token(token)
            if not current_user:
                return jsonify({'error': 'Invalid or expired token'}), 401
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return jsonify({'error': 'Token verification failed'}), 401
        
        # Passer l'utilisateur à la route
        return f(current_user, *args, **kwargs)
    
    return decorated


# ============================================================
# AUTH ROUTES
# ============================================================

@api_v2.route('/auth/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Créer utilisateur
        user = user_service.register_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            role=data.get('role', 'user')
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@api_v2.route('/auth/login', methods=['POST'])
def login():
    """Connexion utilisateur"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password required'}), 400
        
        # Authentifier
        result = user_service.authenticate_user(
            username=data['username'],
            password=data['password']
        )
        
        if not result:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        return jsonify({
            'message': 'Login successful',
            'user': result
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@api_v2.route('/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Récupère l'utilisateur courant"""
    return jsonify({'user': current_user}), 200


# ============================================================
# WORKSPACE ROUTES
# ============================================================

@api_v2.route('/workspaces', methods=['GET'])
@token_required
def get_workspaces(current_user):
    """Liste les workspaces de l'utilisateur"""
    try:
        # Paramètres de filtrage
        status = request.args.get('status')
        priority = request.args.get('priority')
        source = request.args.get('source')
        limit = request.args.get('limit', type=int)
        
        workspaces = workspace_service.list_workspaces(
            user_id=current_user['id'],
            status=status,
            priority=priority,
            source=source,
            limit=limit
        )
        
        return jsonify({'workspaces': workspaces}), 200
        
    except Exception as e:
        logger.error(f"Error listing workspaces: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@api_v2.route('/workspaces', methods=['POST'])
@token_required
def create_workspace_route(current_user):
    """Crée un nouveau workspace"""
    try:
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'error': 'Title is required'}), 400
        
        workspace = workspace_service.create_workspace(
            user_id=current_user['id'],
            title=data['title'],
            source=data.get('source', 'manual'),
            status=data.get('status'),
            priority=data.get('priority')
        )
        
        return jsonify({
            'message': 'Workspace created successfully',
            'workspace': workspace
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating workspace: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@api_v2.route('/workspaces/<int:workspace_id>', methods=['GET'])
@token_required
def get_workspace_route(current_user, workspace_id):
    """Récupère un workspace par ID"""
    try:
        workspace = workspace_service.get_workspace(workspace_id)
        
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        
        # Vérifier que l'utilisateur est propriétaire
        if workspace['user_id'] != current_user['id']:
            return jsonify({'error': 'Forbidden'}), 403
        
        return jsonify({'workspace': workspace}), 200
        
    except Exception as e:
        logger.error(f"Error getting workspace: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@api_v2.route('/workspaces/<int:workspace_id>', methods=['PUT', 'PATCH'])
@token_required
def update_workspace_route(current_user, workspace_id):
    """Met à jour un workspace"""
    try:
        # Vérifier propriétaire
        workspace = workspace_service.get_workspace(workspace_id)
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        if workspace['user_id'] != current_user['id']:
            return jsonify({'error': 'Forbidden'}), 403
        
        data = request.get_json()
        
        # Mettre à jour
        updated = workspace_service.update_workspace(workspace_id, **data)
        
        return jsonify({
            'message': 'Workspace updated successfully',
            'workspace': updated
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating workspace: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@api_v2.route('/workspaces/<int:workspace_id>', methods=['DELETE'])
@token_required
def delete_workspace_route(current_user, workspace_id):
    """Supprime un workspace"""
    try:
        # Vérifier propriétaire
        workspace = workspace_service.get_workspace(workspace_id)
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        if workspace['user_id'] != current_user['id']:
            return jsonify({'error': 'Forbidden'}), 403
        
        # Supprimer
        success = workspace_service.delete_workspace(workspace_id)
        
        if success:
            return jsonify({'message': 'Workspace deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete workspace'}), 500
        
    except Exception as e:
        logger.error(f"Error deleting workspace: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ============================================================
# MESSAGE ROUTES
# ============================================================

@api_v2.route('/workspaces/<int:workspace_id>/messages', methods=['GET'])
@token_required
def get_workspace_messages_route(current_user, workspace_id):
    """Récupère les messages d'un workspace"""
    try:
        # Vérifier propriétaire
        workspace = workspace_service.get_workspace(workspace_id)
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        if workspace['user_id'] != current_user['id']:
            return jsonify({'error': 'Forbidden'}), 403
        
        messages = workspace_service.get_workspace_messages(workspace_id)
        
        return jsonify({'messages': messages}), 200
        
    except Exception as e:
        logger.error(f"Error getting messages: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@api_v2.route('/workspaces/<int:workspace_id>/messages', methods=['POST'])
@token_required
def add_message_route(current_user, workspace_id):
    """Ajoute un message à un workspace"""
    try:
        # Vérifier propriétaire
        workspace = workspace_service.get_workspace(workspace_id)
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        if workspace['user_id'] != current_user['id']:
            return jsonify({'error': 'Forbidden'}), 403
        
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'error': 'Content is required'}), 400
        
        message = workspace_service.add_message(
            workspace_id=workspace_id,
            role=data.get('role', 'user'),
            content=data['content'],
            metadata=data.get('metadata')
        )
        
        return jsonify({
            'message': 'Message added successfully',
            'data': message
        }), 201
        
    except Exception as e:
        logger.error(f"Error adding message: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ============================================================
# STATS & HEALTH
# ============================================================

@api_v2.route('/stats', methods=['GET'])
@token_required
def get_user_stats_route(current_user):
    """Statistiques de l'utilisateur"""
    try:
        stats = db_service.get_user_stats(current_user['id'])
        return jsonify({'stats': stats}), 200
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@api_v2.route('/health', methods=['GET'])
def health_check():
    """Health check de l'API"""
    try:
        db_healthy = db_service.health_check()
        
        return jsonify({
            'status': 'healthy' if db_healthy else 'unhealthy',
            'database': 'connected' if db_healthy else 'disconnected',
            'version': 'v2-postgres'
        }), 200 if db_healthy else 503
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 503
