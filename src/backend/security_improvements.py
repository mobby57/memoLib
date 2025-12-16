"""
Améliorations de sécurité pour IAPosteManager
"""
import bcrypt
import secrets
import re
from functools import wraps
from flask import request, jsonify, session
from datetime import datetime, timedelta
import time

class SecurityManager:
    def __init__(self):
        self.rate_limits = {}
        self.failed_attempts = {}
        self.csrf_tokens = {}
    
    def hash_password(self, password):
        """Hasher un mot de passe avec bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt)
    
    def verify_password(self, password, hashed):
        """Vérifier un mot de passe hashé"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    
    def generate_csrf_token(self):
        """Générer un token CSRF"""
        token = secrets.token_urlsafe(32)
        self.csrf_tokens[token] = datetime.now() + timedelta(hours=1)
        return token
    
    def validate_csrf_token(self, token):
        """Valider un token CSRF"""
        if token not in self.csrf_tokens:
            return False
        if datetime.now() > self.csrf_tokens[token]:
            del self.csrf_tokens[token]
            return False
        return True
    
    def rate_limit(self, key, limit=100, window=3600):
        """Rate limiting par clé"""
        now = time.time()
        
        # Nettoyer les anciennes entrées
        if key in self.rate_limits:
            self.rate_limits[key] = [
                timestamp for timestamp in self.rate_limits[key]
                if now - timestamp < window
            ]
        else:
            self.rate_limits[key] = []
        
        # Vérifier la limite
        if len(self.rate_limits[key]) >= limit:
            return False
        
        # Ajouter la requête actuelle
        self.rate_limits[key].append(now)
        return True
    
    def validate_input(self, data, schema):
        """Valider les données d'entrée"""
        errors = []
        
        for field, rules in schema.items():
            value = data.get(field)
            
            # Requis
            if rules.get('required', False) and not value:
                errors.append(f"{field} est requis")
                continue
            
            if value is None:
                continue
            
            # Type
            expected_type = rules.get('type')
            if expected_type and not isinstance(value, expected_type):
                errors.append(f"{field} doit être de type {expected_type.__name__}")
            
            # Longueur
            if 'min_length' in rules and len(str(value)) < rules['min_length']:
                errors.append(f"{field} trop court (min {rules['min_length']})")
            
            if 'max_length' in rules and len(str(value)) > rules['max_length']:
                errors.append(f"{field} trop long (max {rules['max_length']})")
            
            # Pattern regex
            if 'pattern' in rules and not re.match(rules['pattern'], str(value)):
                errors.append(f"{field} format invalide")
        
        return errors
    
    def sanitize_html(self, text):
        """Nettoyer le HTML dangereux"""
        if not text:
            return text
        
        # Supprimer les balises script et style
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.IGNORECASE | re.DOTALL)
        
        # Supprimer les attributs dangereux
        text = re.sub(r'on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
        text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
        
        return text

# Décorateurs de sécurité
security = SecurityManager()

def require_csrf(f):
    """Décorateur pour vérifier le token CSRF"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ['POST', 'PUT', 'DELETE']:
            token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
            if not token or not security.validate_csrf_token(token):
                return jsonify({'error': 'Token CSRF invalide'}), 403
        return f(*args, **kwargs)
    return decorated_function

def rate_limited(limit=100, window=3600):
    """Décorateur pour rate limiting"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            key = f"{request.remote_addr}:{f.__name__}"
            if not security.rate_limit(key, limit, window):
                return jsonify({'error': 'Trop de requêtes'}), 429
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_json(schema):
    """Décorateur pour valider les données JSON"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json() or {}
            errors = security.validate_input(data, schema)
            if errors:
                return jsonify({'errors': errors}), 400
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Schémas de validation
SCHEMAS = {
    'login': {
        'password': {
            'required': True,
            'type': str,
            'min_length': 8,
            'max_length': 128
        }
    },
    'email': {
        'recipient': {
            'required': True,
            'type': str,
            'pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        'subject': {
            'required': True,
            'type': str,
            'max_length': 200
        },
        'body': {
            'required': True,
            'type': str,
            'max_length': 10000
        }
    },
    'email_generator': {
        'purpose': {
            'required': True,
            'type': str,
            'pattern': r'^[a-z_]+$'
        },
        'duration_hours': {
            'required': True,
            'type': int
        },
        'custom_name': {
            'type': str,
            'pattern': r'^[a-zA-Z0-9_-]+$',
            'max_length': 50
        }
    }
}