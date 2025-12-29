"""
Flask App - PostgreSQL Services Only
Serveur minimal pour tester les routes API v2 PostgreSQL
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import os
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Import PostgreSQL services
from src.backend.services.workspace_service_postgres import get_workspace_service
from src.backend.services.user_service_postgres import get_user_service
from src.backend.services.database_service import get_database_service

# Services - Initialize with error handling
try:
    workspace_service = get_workspace_service()
    user_service = get_user_service()
    db_service = get_database_service()
    logger.info("✅ PostgreSQL services initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize services: {e}")
    logger.error("Please check your DATABASE_URL in .env file")
    raise


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

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5000"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # ============================================================
    # AUTH ROUTES
    # ============================================================
    
    @app.route('/api/v2/auth/register', methods=['POST'])
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
    
    
    @app.route('/api/v2/auth/login', methods=['POST'])
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
    
    
    @app.route('/api/v2/auth/me', methods=['GET'])
    @token_required
    def get_current_user(current_user):
        """Récupère l'utilisateur courant"""
        return jsonify({'user': current_user}), 200
    
    
    # ============================================================
    # WORKSPACE ROUTES
    # ============================================================
    
    @app.route('/api/v2/workspaces', methods=['GET'])
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
    
    
    @app.route('/api/v2/workspaces', methods=['POST'])
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
    
    
    @app.route('/api/v2/workspaces/<int:workspace_id>', methods=['GET'])
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
    
    
    @app.route('/api/v2/workspaces/<int:workspace_id>', methods=['PUT', 'PATCH'])
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
    
    
    @app.route('/api/v2/workspaces/<int:workspace_id>', methods=['DELETE'])
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
    
    @app.route('/api/v2/workspaces/<int:workspace_id>/messages', methods=['GET'])
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
    
    
    @app.route('/api/v2/workspaces/<int:workspace_id>/messages', methods=['POST'])
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
    
    @app.route('/api/v2/stats', methods=['GET'])
    @token_required
    def get_user_stats_route(current_user):
        """Statistiques de l'utilisateur"""
        try:
            stats = db_service.get_user_stats(current_user['id'])
            return jsonify({'stats': stats}), 200
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return jsonify({'error': 'Internal server error'}), 500
    
    
    @app.route('/api/v2/health', methods=['GET'])
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
    
    
    # ============================================================
    # ROOT & DEBUG ROUTES
    # ============================================================
    
    @app.route('/')
    def index():
        """Documentation de l'API"""
        return jsonify({
            'service': 'IA Poste Manager - PostgreSQL API',
            'version': '2.0.0-postgres',
            'endpoints': [
                'GET /api/v2/health - Health check',
                'POST /api/v2/auth/register - Inscription',
                'POST /api/v2/auth/login - Connexion',
                'GET /api/v2/auth/me - Utilisateur courant',
                'GET /api/v2/workspaces - Liste workspaces',
                'POST /api/v2/workspaces - Créer workspace',
                'GET /api/v2/workspaces/:id - Détail workspace',
                'PUT /api/v2/workspaces/:id - Mettre à jour workspace',
                'DELETE /api/v2/workspaces/:id - Supprimer workspace',
                'GET /api/v2/workspaces/:id/messages - Liste messages',
                'POST /api/v2/workspaces/:id/messages - Ajouter message',
                'GET /api/v2/stats - Statistiques utilisateur'
            ]
        }), 200
    
    
    @app.route('/routes')
    def list_routes_debug():
        """Liste toutes les routes enregistrées (debug)"""
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': sorted(list(rule.methods - {'HEAD', 'OPTIONS'})),
                'path': rule.rule
            })
        return jsonify({'routes': sorted(routes, key=lambda x: x['path'])}), 200
    
    logger.info("All routes registered successfully")
    
    return app


if __name__ == '__main__':
    try:
        logger.info("Creating Flask application...")
        app = create_app()
        
        print("\n" + "="*60)
        print("IA POSTE MANAGER - PostgreSQL API Server (Development)")
        print("="*60)
        print("\n📋 Available endpoints:")
        print("   - GET  /              - API documentation")
        print("   - GET  /routes        - List all routes")
        print("   - GET  /api/v2/health - Health check")
        print("   - POST /api/v2/auth/register")
        print("   - POST /api/v2/auth/login")
        print("   - GET  /api/v2/auth/me")
        print("   - GET  /api/v2/workspaces")
        print("   - POST /api/v2/workspaces")
        print("   - GET  /api/v2/workspaces/:id")
        print("   - PUT  /api/v2/workspaces/:id")
        print("   - DELETE /api/v2/workspaces/:id")
        print("   - GET  /api/v2/workspaces/:id/messages")
        print("   - POST /api/v2/workspaces/:id/messages")
        print("   - GET  /api/v2/stats")
        print("\n🌐 Server: http://localhost:5000")
        print("="*60 + "\n")
        
        # Test database connection before starting
        logger.info("Testing database connection...")
        if db_service.health_check():
            logger.info("✅ Database connection OK")
        else:
            logger.error("❌ Database connection failed!")
            logger.error("Please check your DATABASE_URL in .env file")
            sys.exit(1)
        
        logger.info("Starting Flask development server...")
        # Use debug=False for stability, use_reloader=False to prevent double startup
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True, use_reloader=False)
        
    except KeyboardInterrupt:
        logger.info("\n⏹️  Server stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
