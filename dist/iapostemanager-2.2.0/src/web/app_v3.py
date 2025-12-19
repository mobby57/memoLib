"""Application Flask v3.0 - Architecture optimisée"""
from flask import Flask
from flask_cors import CORS
from flask_talisman import Talisman
import os
from dotenv import load_dotenv

from src.core.config import Config
from src.core.auth import AuthManager
from src.core.database import Database
from src.core.cache import CacheManager
from src.services.email_service_real import EmailService
from src.services.ai_service_real import AIService
from src.monitoring.metrics import MetricsManager
from src.api import api_bp

def create_app(config_name='development'):
    """Factory pattern pour créer l'app"""
    load_dotenv()
    
    app = Flask(__name__, template_folder='../../templates', static_folder='../../static')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    
    # Extensions
    CORS(app)
    Talisman(app, force_https=False)
    
    # Services
    auth = AuthManager()
    db = Database(os.path.join(Config.APP_DIR, 'app.db'))
    cache = CacheManager()
    email_service = EmailService()
    metrics = MetricsManager(app)
    
    # Blueprints
    app.register_blueprint(api_bp)
    
    # Routes principales
    from src.web.routes import main_bp
    app.register_blueprint(main_bp)
    
    # Gestionnaires d'erreurs
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='127.0.0.1', port=5000)