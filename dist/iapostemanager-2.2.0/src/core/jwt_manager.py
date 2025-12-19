"""JWT token management"""
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

class JWTManager:
    def __init__(self, secret=None):
        self.secret = secret or os.environ.get('SECRET_KEY', 'dev-secret-key')
        self.algorithm = 'HS256'
        self.access_token_expires = timedelta(minutes=15)
        self.refresh_token_expires = timedelta(days=30)
    
    def create_access_token(self, user_id):
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + self.access_token_expires,
            'type': 'access'
        }
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id):
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + self.refresh_token_expires,
            'type': 'refresh'
        }
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)
    
    def verify_token(self, token, token_type='access'):
        try:
            payload = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            if payload.get('type') != token_type:
                return None
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def require_auth(self, f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            if not token:
                return jsonify({'error': 'Token required'}), 401
            
            payload = self.verify_token(token)
            if not payload:
                return jsonify({'error': 'Invalid token'}), 401
            
            request.user_id = payload['user_id']
            return f(*args, **kwargs)
        return decorated

jwt_manager = JWTManager()
