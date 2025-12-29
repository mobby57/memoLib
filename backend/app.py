from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from backend.models import db
from backend.routes import api
import os
import sys

# Import security middleware
try:
    from src.backend.middleware.security import SecurityMiddleware
    from src.backend.middleware.error_handler import ErrorHandler
    from src.backend.middleware.api_auth import APIKeyAuth
    from src.backend.middleware.metrics import MetricsCollector
    MIDDLEWARE_AVAILABLE = True
except ImportError:
    MIDDLEWARE_AVAILABLE = False

# Add src to path for new services
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import new workspace API
try:
    from src.backend.api.workspace_routes import workspace_bp
    WORKSPACE_API_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import workspace API: {e}")
    WORKSPACE_API_AVAILABLE = False

# Import PostgreSQL routes
try:
    from backend.routes_postgres import api_v2
    POSTGRES_ROUTES_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import PostgreSQL routes: {e}")
    POSTGRES_ROUTES_AVAILABLE = False

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/iapostemanager')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    CORS(app)
    
    # Initialize middleware
    if MIDDLEWARE_AVAILABLE:
        security = SecurityMiddleware()
        security.init_app(app)
        
        error_handler = ErrorHandler()
        error_handler.init_app(app)
        
        api_auth = APIKeyAuth()
        api_auth.init_app(app)
        
        metrics = MetricsCollector()
        app.metrics = metrics
        
        print("✅ All middleware enabled")
    
    # Register blueprints
    app.register_blueprint(api)
    
    # Register new workspace API if available
    if WORKSPACE_API_AVAILABLE:
        app.register_blueprint(workspace_bp)
        print("✅ Workspace API registered")
    
    # Register PostgreSQL routes if available
    if POSTGRES_ROUTES_AVAILABLE:
        app.register_blueprint(api_v2)
        print("✅ PostgreSQL API v2 registered at /api/v2")
    
    # Health check route
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'IA Poste Manager Backend'}
    
    @app.route('/api/status')
    def api_status():
        return {
            'status': 'running', 
            'version': '2.3',
            'workspace_api': WORKSPACE_API_AVAILABLE,
            'postgres_api': POSTGRES_ROUTES_AVAILABLE,
            'middleware': MIDDLEWARE_AVAILABLE,
            'endpoints': {
                'legacy': '/api/*',
                'workspace': '/api/workspace/*' if WORKSPACE_API_AVAILABLE else 'unavailable',
                'postgres_v2': '/api/v2/*' if POSTGRES_ROUTES_AVAILABLE else 'unavailable'
            }
        }
    
    @app.route('/api/metrics')
    def get_metrics():
        if hasattr(app, 'metrics'):
            return app.metrics.get_system_metrics()
        return {'error': 'Metrics not available'}
    
    # Create tables
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Database error: {e}")
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)