"""
Module UnifiedAPI - API REST complète avec sécurité avancée
Propriété: MS CONSEILS - Sarra Boudjellal
Version: 2.3 Production Ready
"""

from flask import Flask, request, jsonify, g, current_app
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import time
import logging
import json
import uuid
from datetime import datetime, timedelta
from functools import wraps
import hashlib
import hmac
from typing import Dict, List, Optional, Any

# Métriques Prometheus
REQUEST_COUNT = prometheus_client.Counter(
    'api_requests_total', 
    'Total API requests', 
    ['method', 'endpoint', 'status']
)
REQUEST_LATENCY = prometheus_client.Histogram(
    'api_request_duration_seconds', 
    'API request latency',
    ['method', 'endpoint']
)
ACTIVE_CONNECTIONS = prometheus_client.Gauge(
    'api_active_connections', 
    'Active API connections'
)
WORKSPACE_OPERATIONS = prometheus_client.Counter(
    'workspace_operations_total',
    'Total workspace operations',
    ['operation', 'client_id', 'status']
)

class UnifiedAPI:
    """API REST unifiée avec sécurité et monitoring intégrés"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialise l'API avec l'application Flask"""
        
        # Configuration de base
        app.config.setdefault('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
        app.config.setdefault('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=24))
        app.config.setdefault('RATELIMIT_STORAGE_URL', 'memory://')
        
        # Extensions
        self.jwt = JWTManager(app)
        self.limiter = Limiter(
            app,
            key_func=get_remote_address,
            default_limits=["1000 per hour"]
        )
        
        # CORS pour le frontend
        CORS(app, origins=["http://localhost:3001", "http://localhost:3000"])
        
        # Configuration du logging
        self.setup_logging(app)
        
        # Middleware de monitoring
        self.setup_monitoring_middleware(app)
        
        # Routes de l'API
        self.register_routes(app)
        
        # Gestionnaires d'erreurs
        self.register_error_handlers(app)
        
        # Configuration JWT
        self.setup_jwt_handlers()
    
    def setup_logging(self, app: Flask):
        """Configure le logging sécurisé"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Logger spécifique pour l'API
        self.logger = logging.getLogger('unified_api')
        
        # Handler pour les logs de sécurité
        security_handler = logging.FileHandler('security.log')
        security_formatter = logging.Formatter(
            '%(asctime)s - SECURITY - %(levelname)s - %(message)s'
        )
        security_handler.setFormatter(security_formatter)
        
        security_logger = logging.getLogger('security')
        security_logger.addHandler(security_handler)
        security_logger.setLevel(logging.WARNING)
    
    def setup_monitoring_middleware(self, app: Flask):
        """Configure le middleware de monitoring"""
        
        @app.before_request
        def before_request():
            g.start_time = time.time()
            ACTIVE_CONNECTIONS.inc()
            
            # Log de la requête (anonymisé)
            self.logger.info(f"Request: {request.method} {request.path}")
        
        @app.after_request
        def after_request(response):
            # Métriques de performance
            duration = time.time() - g.start_time
            
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=response.status_code
            ).inc()
            
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown'
            ).observe(duration)
            
            ACTIVE_CONNECTIONS.dec()
            
            # Headers de sécurité
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            
            return response
    
    def register_routes(self, app: Flask):
        """Enregistre toutes les routes de l'API"""
        
        # Route de santé
        @app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'version': '2.3'
            })
        
        # Métriques Prometheus
        @app.route('/metrics', methods=['GET'])
        def metrics():
            return generate_latest(), 200, {'Content-Type': 'text/plain'}
        
        # Authentification
        @app.route('/api/v1/auth/login', methods=['POST'])
        @self.limiter.limit("5 per minute")
        def login():
            return self.handle_login()
        
        @app.route('/api/v1/auth/refresh', methods=['POST'])
        @jwt_required(refresh=True)
        def refresh():
            return self.handle_refresh()
        
        # Gestion des workspaces
        @app.route('/api/v1/workspace', methods=['POST'])
        @jwt_required()
        @self.limiter.limit("10 per minute")
        def create_workspace():
            return self.handle_create_workspace()
        
        @app.route('/api/v1/workspace/<workspace_id>', methods=['GET'])
        @jwt_required()
        def get_workspace(workspace_id):
            return self.handle_get_workspace(workspace_id)
        
        @app.route('/api/v1/workspace/<workspace_id>/analyze', methods=['POST'])
        @jwt_required()
        @self.limiter.limit("5 per minute")
        def analyze_email(workspace_id):
            return self.handle_analyze_email(workspace_id)
        
        @app.route('/api/v1/workspace/<workspace_id>/form', methods=['GET'])
        @jwt_required()
        def get_adaptive_form(workspace_id):
            return self.handle_get_adaptive_form(workspace_id)
        
        @app.route('/api/v1/workspace/<workspace_id>/form', methods=['POST'])
        @jwt_required()
        def submit_form(workspace_id):
            return self.handle_submit_form(workspace_id)
        
        @app.route('/api/v1/workspace/<workspace_id>/response', methods=['POST'])
        @jwt_required()
        def generate_response(workspace_id):
            return self.handle_generate_response(workspace_id)
        
        @app.route('/api/v1/workspace/<workspace_id>/questions', methods=['GET'])
        @jwt_required()
        def get_human_questions(workspace_id):
            return self.handle_get_human_questions(workspace_id)
        
        # Gestion des clients
        @app.route('/api/v1/clients', methods=['GET'])
        @jwt_required()
        @self.require_admin
        def list_clients():
            return self.handle_list_clients()
        
        @app.route('/api/v1/clients/<client_id>/config', methods=['GET', 'PUT'])
        @jwt_required()
        @self.require_admin
        def client_config(client_id):
            if request.method == 'GET':
                return self.handle_get_client_config(client_id)
            else:
                return self.handle_update_client_config(client_id)
        
        # Analytics et reporting
        @app.route('/api/v1/analytics/dashboard', methods=['GET'])
        @jwt_required()
        def analytics_dashboard():
            return self.handle_analytics_dashboard()
        
        @app.route('/api/v1/analytics/reports', methods=['GET'])
        @jwt_required()
        def analytics_reports():
            return self.handle_analytics_reports()
    
    def register_error_handlers(self, app: Flask):
        """Enregistre les gestionnaires d'erreurs"""
        
        @app.errorhandler(400)
        def bad_request(error):
            return jsonify({
                'error': 'Bad Request',
                'message': 'La requête est malformée',
                'code': 400
            }), 400
        
        @app.errorhandler(401)
        def unauthorized(error):
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Authentification requise',
                'code': 401
            }), 401
        
        @app.errorhandler(403)
        def forbidden(error):
            return jsonify({
                'error': 'Forbidden',
                'message': 'Accès interdit',
                'code': 403
            }), 403
        
        @app.errorhandler(404)
        def not_found(error):
            return jsonify({
                'error': 'Not Found',
                'message': 'Ressource non trouvée',
                'code': 404
            }), 404
        
        @app.errorhandler(429)
        def rate_limit_exceeded(error):
            return jsonify({
                'error': 'Rate Limit Exceeded',
                'message': 'Trop de requêtes, veuillez patienter',
                'code': 429
            }), 429
        
        @app.errorhandler(500)
        def internal_error(error):
            self.logger.error(f"Erreur interne: {error}")
            return jsonify({
                'error': 'Internal Server Error',
                'message': 'Erreur interne du serveur',
                'code': 500
            }), 500
    
    def setup_jwt_handlers(self):
        """Configure les gestionnaires JWT"""
        
        @self.jwt.expired_token_loader
        def expired_token_callback(jwt_header, jwt_payload):
            return jsonify({
                'error': 'Token Expired',
                'message': 'Le token a expiré'
            }), 401
        
        @self.jwt.invalid_token_loader
        def invalid_token_callback(error):
            return jsonify({
                'error': 'Invalid Token',
                'message': 'Token invalide'
            }), 401
        
        @self.jwt.unauthorized_loader
        def missing_token_callback(error):
            return jsonify({
                'error': 'Missing Token',
                'message': 'Token d\'authentification requis'
            }), 401
    
    # Décorateurs de sécurité
    
    def require_admin(self, f):
        """Décorateur pour les routes admin uniquement"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = get_jwt_identity()
            # Vérifier si l'utilisateur est admin
            if not self.is_admin_user(current_user):
                return jsonify({
                    'error': 'Admin Required',
                    'message': 'Droits administrateur requis'
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    
    def validate_client_access(self, f):
        """Décorateur pour valider l'accès client"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = get_jwt_identity()
            client_id = kwargs.get('client_id') or request.json.get('client_id')
            
            if not self.user_has_client_access(current_user, client_id):
                return jsonify({
                    'error': 'Access Denied',
                    'message': 'Accès client non autorisé'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    
    # Handlers des routes
    
    def handle_login(self):
        """Gère l'authentification utilisateur"""
        try:
            data = request.get_json()
            
            if not data or not data.get('email') or not data.get('password'):
                return jsonify({
                    'error': 'Missing Credentials',
                    'message': 'Email et mot de passe requis'
                }), 400
            
            email = data['email']
            password = data['password']
            
            # Validation de l'utilisateur (à implémenter selon votre système)
            user = self.authenticate_user(email, password)
            
            if not user:
                # Log de tentative de connexion échouée
                security_logger = logging.getLogger('security')
                security_logger.warning(f"Tentative de connexion échouée pour {email}")
                
                return jsonify({
                    'error': 'Invalid Credentials',
                    'message': 'Identifiants invalides'
                }), 401
            
            # Création du token JWT
            access_token = create_access_token(
                identity=user['id'],
                additional_claims={
                    'email': user['email'],
                    'role': user['role'],
                    'client_ids': user.get('client_ids', [])
                }
            )
            
            # Log de connexion réussie
            self.logger.info(f"Connexion réussie pour utilisateur {user['id']}")
            
            return jsonify({
                'access_token': access_token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'role': user['role'],
                    'client_ids': user.get('client_ids', [])
                }
            })
            
        except Exception as e:
            self.logger.error(f"Erreur lors de l'authentification: {e}")
            return jsonify({
                'error': 'Authentication Error',
                'message': 'Erreur lors de l\'authentification'
            }), 500
    
    def handle_refresh(self):
        """Gère le rafraîchissement du token"""
        current_user = get_jwt_identity()
        new_token = create_access_token(identity=current_user)
        
        return jsonify({
            'access_token': new_token
        })
    
    def handle_create_workspace(self):
        """Gère la création d'un workspace"""
        try:
            data = request.get_json()
            current_user = get_jwt_identity()
            
            # Validation des données
            if not data or not data.get('email_data'):
                return jsonify({
                    'error': 'Missing Data',
                    'message': 'Données email requises'
                }), 400
            
            email_data = data['email_data']
            client_id = data.get('client_id', 'default')
            priority = data.get('priority', 'normal')
            
            # Vérification des permissions client
            if not self.user_has_client_access(current_user, client_id):
                return jsonify({
                    'error': 'Access Denied',
                    'message': 'Accès client non autorisé'
                }), 403
            
            # Création du workspace via le WorkspaceManager
            workspace_manager = self.get_workspace_manager()
            result = workspace_manager.create_workspace(email_data, client_id, priority)
            
            # Métriques
            WORKSPACE_OPERATIONS.labels(
                operation='create',
                client_id=client_id,
                status='success' if result.get('status') == 'success' else 'error'
            ).inc()
            
            if result.get('status') == 'success':
                return jsonify(result), 201
            else:
                return jsonify(result), 400
                
        except Exception as e:
            self.logger.error(f"Erreur création workspace: {e}")
            WORKSPACE_OPERATIONS.labels(
                operation='create',
                client_id=data.get('client_id', 'unknown'),
                status='error'
            ).inc()
            
            return jsonify({
                'error': 'Creation Error',
                'message': 'Erreur lors de la création du workspace'
            }), 500
    
    def handle_get_workspace(self, workspace_id):
        """Récupère un workspace spécifique"""
        try:
            current_user = get_jwt_identity()
            
            # Récupération du workspace
            workspace_manager = self.get_workspace_manager()
            workspace = workspace_manager.get_workspace(workspace_id)
            
            if not workspace:
                return jsonify({
                    'error': 'Not Found',
                    'message': 'Workspace non trouvé'
                }), 404
            
            # Vérification des permissions
            if not self.user_has_workspace_access(current_user, workspace):
                return jsonify({
                    'error': 'Access Denied',
                    'message': 'Accès workspace non autorisé'
                }), 403
            
            return jsonify({
                'workspace': workspace,
                'status': 'success'
            })
            
        except Exception as e:
            self.logger.error(f"Erreur récupération workspace: {e}")
            return jsonify({
                'error': 'Retrieval Error',
                'message': 'Erreur lors de la récupération'
            }), 500
    
    def handle_analyze_email(self, workspace_id):
        """Gère l'analyse d'email"""
        try:
            current_user = get_jwt_identity()
            data = request.get_json()
            
            # Vérification des permissions workspace
            if not self.user_has_workspace_access(current_user, {'id': workspace_id}):
                return jsonify({
                    'error': 'Access Denied',
                    'message': 'Accès workspace non autorisé'
                }), 403
            
            # Analyse via l'EmailAnalyzer
            email_analyzer = self.get_email_analyzer()
            content = data.get('content', '')
            attachments = data.get('attachments', [])
            
            analysis_result = email_analyzer.analyze_content(content, attachments)
            
            # Sauvegarde du résultat d'analyse
            workspace_manager = self.get_workspace_manager()
            workspace_manager.update_analysis(workspace_id, analysis_result)
            
            return jsonify({
                'analysis': analysis_result,
                'status': 'success'
            })
            
        except Exception as e:
            self.logger.error(f"Erreur analyse email: {e}")
            return jsonify({
                'error': 'Analysis Error',
                'message': 'Erreur lors de l\'analyse'
            }), 500
    
    def handle_get_adaptive_form(self, workspace_id):
        """Récupère le formulaire adaptatif"""
        try:
            current_user = get_jwt_identity()
            
            # Vérification des permissions
            if not self.user_has_workspace_access(current_user, {'id': workspace_id}):
                return jsonify({
                    'error': 'Access Denied',
                    'message': 'Accès workspace non autorisé'
                }), 403
            
            # Récupération du workspace et génération du formulaire
            workspace_manager = self.get_workspace_manager()
            workspace = workspace_manager.get_workspace(workspace_id)
            
            if not workspace:
                return jsonify({
                    'error': 'Not Found',
                    'message': 'Workspace non trouvé'
                }), 404
            
            # Génération du formulaire adaptatif
            form_generator = self.get_form_generator()
            client_config = self.get_client_config(workspace.get('client_id'))
            
            form_schema = form_generator.generate_form_schema(
                workspace.get('missing_info', []),
                workspace.get('analysis_result', {})
            )
            
            return jsonify({
                'form_schema': form_schema,
                'status': 'success'
            })
            
        except Exception as e:
            self.logger.error(f"Erreur génération formulaire: {e}")
            return jsonify({
                'error': 'Form Generation Error',
                'message': 'Erreur lors de la génération du formulaire'
            }), 500
    
    def handle_submit_form(self, workspace_id):
        """Gère la soumission du formulaire"""
        try:
            current_user = get_jwt_identity()
            data = request.get_json()
            
            # Vérification des permissions
            if not self.user_has_workspace_access(current_user, {'id': workspace_id}):
                return jsonify({
                    'error': 'Access Denied',
                    'message': 'Accès workspace non autorisé'
                }), 403
            
            form_data = data.get('form_data', {})
            
            # Validation du formulaire
            form_validator = self.get_form_validator()
            workspace_manager = self.get_workspace_manager()
            workspace = workspace_manager.get_workspace(workspace_id)
            
            if not workspace:
                return jsonify({
                    'error': 'Not Found',
                    'message': 'Workspace non trouvé'
                }), 404
            
            # Récupération du schéma de formulaire
            form_generator = self.get_form_generator()
            form_schema = workspace.get('generated_form', {})
            
            # Validation
            validation_result = form_validator.validate_form_data(form_data, form_schema)
            
            if not validation_result['is_valid']:
                return jsonify({
                    'error': 'Validation Error',
                    'message': 'Données du formulaire invalides',
                    'errors': validation_result['errors']
                }), 400
            
            # Mise à jour du workspace avec les données du formulaire
            workspace_manager.update_form_data(workspace_id, validation_result['cleaned_data'])
            
            return jsonify({
                'status': 'success',
                'message': 'Formulaire soumis avec succès',
                'warnings': validation_result.get('warnings', [])
            })
            
        except Exception as e:
            self.logger.error(f"Erreur soumission formulaire: {e}")
            return jsonify({
                'error': 'Submission Error',
                'message': 'Erreur lors de la soumission'
            }), 500
    
    def handle_generate_response(self, workspace_id):
        """Gère la génération de réponse IA"""
        try:
            current_user = get_jwt_identity()
            data = request.get_json()
            
            # Vérification des permissions
            if not self.user_has_workspace_access(current_user, {'id': workspace_id}):
                return jsonify({
                    'error': 'Access Denied',
                    'message': 'Accès workspace non autorisé'
                }), 403
            
            # Récupération du workspace
            workspace_manager = self.get_workspace_manager()
            workspace = workspace_manager.get_workspace(workspace_id)
            
            if not workspace:
                return jsonify({
                    'error': 'Not Found',
                    'message': 'Workspace non trouvé'
                }), 404
            
            # Paramètres de génération
            tone = data.get('tone', 'professional')
            language = data.get('language', 'auto')
            
            # Génération de la réponse
            email_data = {
                'content': workspace.get('email_content', ''),
                'analysis': workspace.get('analysis_result', {}),
                'form_data': workspace.get('form_data', {})
            }
            
            response_result = workspace_manager.generate_ai_response(email_data, tone, language)
            
            # Sauvegarde de la réponse générée
            workspace_manager.update_ai_response(workspace_id, response_result)
            
            return jsonify({
                'response': response_result,
                'status': 'success'
            })
            
        except Exception as e:
            self.logger.error(f"Erreur génération réponse: {e}")
            return jsonify({
                'error': 'Response Generation Error',
                'message': 'Erreur lors de la génération de réponse'
            }), 500
    
    def handle_get_human_questions(self, workspace_id):
        """Récupère les questions humaines simulées"""
        try:
            current_user = get_jwt_identity()
            
            # Vérification des permissions
            if not self.user_has_workspace_access(current_user, {'id': workspace_id}):
                return jsonify({
                    'error': 'Access Denied',
                    'message': 'Accès workspace non autorisé'
                }), 403
            
            # Récupération du workspace
            workspace_manager = self.get_workspace_manager()
            workspace = workspace_manager.get_workspace(workspace_id)
            
            if not workspace:
                return jsonify({
                    'error': 'Not Found',
                    'message': 'Workspace non trouvé'
                }), 404
            
            # Génération des questions humaines
            email_content = workspace.get('email_content', '')
            context = workspace.get('analysis_result', {})
            
            questions = workspace_manager.simulate_human_questions(email_content, context)
            
            return jsonify({
                'questions': questions,
                'status': 'success'
            })
            
        except Exception as e:
            self.logger.error(f"Erreur génération questions: {e}")
            return jsonify({
                'error': 'Questions Generation Error',
                'message': 'Erreur lors de la génération des questions'
            }), 500
    
    def handle_analytics_dashboard(self):
        """Gère les données du dashboard analytics"""
        try:
            current_user = get_jwt_identity()
            
            # Récupération des métriques
            analytics_manager = self.get_analytics_manager()
            dashboard_data = analytics_manager.get_dashboard_data(current_user)
            
            return jsonify({
                'dashboard': dashboard_data,
                'status': 'success'
            })
            
        except Exception as e:
            self.logger.error(f"Erreur dashboard analytics: {e}")
            return jsonify({
                'error': 'Analytics Error',
                'message': 'Erreur lors de la récupération des analytics'
            }), 500
    
    # Méthodes utilitaires
    
    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authentifie un utilisateur (à implémenter selon votre système)"""
        # Implémentation factice - remplacer par votre logique d'authentification
        users = {
            'admin@msconseils.fr': {
                'id': 'admin-001',
                'email': 'admin@msconseils.fr',
                'password_hash': generate_password_hash('admin123'),
                'role': 'admin',
                'client_ids': ['ms_conseils', 'all']
            }
        }
        
        user = users.get(email)
        if user and check_password_hash(user['password_hash'], password):
            return user
        
        return None
    
    def is_admin_user(self, user_id: str) -> bool:
        """Vérifie si un utilisateur est admin"""
        # Implémentation à adapter selon votre système
        return user_id == 'admin-001'
    
    def user_has_client_access(self, user_id: str, client_id: str) -> bool:
        """Vérifie si un utilisateur a accès à un client"""
        # Implémentation à adapter selon votre système
        return True  # Temporaire
    
    def user_has_workspace_access(self, user_id: str, workspace: Dict) -> bool:
        """Vérifie si un utilisateur a accès à un workspace"""
        # Implémentation à adapter selon votre système
        return True  # Temporaire
    
    def get_workspace_manager(self):
        """Récupère l'instance du WorkspaceManager"""
        # À implémenter selon votre architecture
        pass
    
    def get_email_analyzer(self):
        """Récupère l'instance de l'EmailAnalyzer"""
        # À implémenter selon votre architecture
        pass
    
    def get_form_generator(self):
        """Récupère l'instance du FormGenerator"""
        # À implémenter selon votre architecture
        pass
    
    def get_form_validator(self):
        """Récupère l'instance du FormValidator"""
        # À implémenter selon votre architecture
        pass
    
    def get_analytics_manager(self):
        """Récupère l'instance de l'AnalyticsManager"""
        # À implémenter selon votre architecture
        pass
    
    def get_client_config(self, client_id: str) -> Dict:
        """Récupère la configuration d'un client"""
        # À implémenter selon votre architecture
        return {}

# Factory function pour créer l'application
def create_app(config=None):
    """Factory function pour créer l'application Flask"""
    app = Flask(__name__)
    
    # Configuration par défaut
    app.config.update({
        'JWT_SECRET_KEY': 'your-secret-key-change-in-production',
        'JWT_ACCESS_TOKEN_EXPIRES': timedelta(hours=24),
        'RATELIMIT_STORAGE_URL': 'memory://'
    })
    
    # Configuration personnalisée
    if config:
        app.config.update(config)
    
    # Initialisation de l'API
    api = UnifiedAPI(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)