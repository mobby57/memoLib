"""Authentification et sécurité"""
from flask import session, request, jsonify
from functools import wraps
import secrets
import time

class AuthManager:
    def __init__(self):
        self.sessions = {}
        self.failed_attempts = {}
    
    def login_required(self, f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not session.get('authenticated'):
                return jsonify({'error': 'Authentication required'}), 401
            return f(*args, **kwargs)
        return decorated
    
    def rate_limit(self, max_attempts=5, window=300):
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                ip = request.remote_addr
                now = time.time()
                
                if ip in self.failed_attempts:
                    attempts = [t for t in self.failed_attempts[ip] if now - t < window]
                    if len(attempts) >= max_attempts:
                        return jsonify({'error': 'Rate limit exceeded'}), 429
                
                return f(*args, **kwargs)
            return decorated
        return decorator
    
    def authenticate(self, password):
        # Simulation - à remplacer par vraie vérification
        if len(password) >= 8:
            session['authenticated'] = True
            session['token'] = secrets.token_hex(16)
            return True
        return False