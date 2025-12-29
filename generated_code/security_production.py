"""
Middleware de sécurité production
Généré par Amazon Q Developer
"""
from flask import request, jsonify, g
from functools import wraps
import redis
import hashlib
import time
from flask_wtf.csrf import CSRFProtect
import bleach

class SecurityMiddleware:
    def __init__(self, app=None):
        self.app = app
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        self.csrf = CSRFProtect()
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        # CSRF Protection
        self.csrf.init_app(app)
        
        # Security Headers
        @app.after_request
        def add_security_headers(response):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Content-Security-Policy'] = "default-src 'self'"
            return response
        
        # Rate Limiting
        @app.before_request
        def rate_limit():
            if request.endpoint and request.endpoint.startswith('api.'):
                if not self.check_rate_limit():
                    return jsonify({'error': 'Rate limit exceeded'}), 429
    
    def check_rate_limit(self, max_requests=60, window=60):
        """Rate limiting par IP"""
        ip = request.remote_addr
        key = f"rate_limit:{ip}"
        
        try:
            current = self.redis_client.get(key)
            if current is None:
                self.redis_client.setex(key, window, 1)
                return True
            elif int(current) < max_requests:
                self.redis_client.incr(key)
                return True
            else:
                return False
        except:
            return True  # Fallback si Redis indisponible
    
    def sanitize_input(self, data):
        """Sanitize user input"""
        if isinstance(data, str):
            return bleach.clean(data, tags=[], strip=True)
        elif isinstance(data, dict):
            return {k: self.sanitize_input(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.sanitize_input(item) for item in data]
        return data

def require_auth(f):
    """Décorateur d'authentification"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Vérifier token/session
        if not g.get('user_id'):
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def validate_input(schema):
    """Décorateur de validation"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = schema.load(request.get_json() or {})
                request.validated_data = data
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': str(e)}), 400
        return decorated_function
    return decorator
