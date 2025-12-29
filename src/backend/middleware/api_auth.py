from flask import request, jsonify
from functools import wraps
import os

class APIKeyAuth:
    def __init__(self, app=None):
        self.api_keys = set(os.getenv('API_KEYS', 'dev-key-123').split(','))
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
    
    def require_api_key(self, f):
        @wraps(f)
        def decorated(*args, **kwargs):
            api_key = request.headers.get('X-API-Key')
            if not api_key or api_key not in self.api_keys:
                return jsonify({'error': 'Invalid API key'}), 401
            return f(*args, **kwargs)
        return decorated