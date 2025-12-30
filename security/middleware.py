"""
Middleware de sécurité pour IA Poste Manager
============================================

Fonctionnalités :
- Validation des tokens JWT
- Rate limiting par IP et utilisateur
- Audit trail de toutes les requêtes
- Protection CSRF
- Détection d'anomalies
- Filtrage XSS et injection SQL

Compatible Flask et FastAPI
"""

import time
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Callable, Any
from functools import wraps
from collections import defaultdict
import json
from pathlib import Path

from flask import Request, Response, request, jsonify, g
import jwt


class SecurityMiddleware:
    """Middleware de sécurité complet"""
    
    def __init__(
        self,
        jwt_secret: Optional[str] = None,
        rate_limit_enabled: bool = True,
        audit_enabled: bool = True
    ):
        """
        Initialise le middleware de sécurité
        
        Args:
            jwt_secret: Secret pour JWT (depuis env si None)
            rate_limit_enabled: Activer le rate limiting
            audit_enabled: Activer l'audit trail
        """
        self.logger = logging.getLogger(__name__)
        
        # Configuration JWT
        import os
        self.jwt_secret = jwt_secret or os.getenv('JWT_SECRET_KEY')
        self.jwt_algorithm = os.getenv('JWT_ALGORITHM', 'HS256')
        self.jwt_expiration = int(os.getenv('JWT_EXPIRATION_MINUTES', '60'))
        
        # Configuration rate limiting
        self.rate_limit_enabled = rate_limit_enabled
        self.rate_limit_per_minute = int(os.getenv('RATE_LIMIT_PER_MINUTE', '60'))
        self.rate_limit_storage: Dict[str, list] = defaultdict(list)
        
        # Audit
        self.audit_enabled = audit_enabled
        self.audit_file = Path(__file__).parent.parent / 'data' / 'audit_trail.json'
        
        # Protection CSRF
        self.csrf_tokens: Dict[str, tuple[str, datetime]] = {}
        self.csrf_token_expiry = timedelta(hours=1)
        
        # Détection d'anomalies
        self.suspicious_patterns = [
            r"(?i)(union.*select|insert.*into|delete.*from|drop.*table)",  # SQL injection
            r"(?i)(<script|javascript:|onerror=|onload=)",  # XSS
            r"(?i)(\.\.\/|\.\.\\)",  # Path traversal
            r"(?i)(eval\(|exec\(|system\()"  # Code injection
        ]
    
    def generate_jwt_token(
        self, 
        user_id: str, 
        email: str, 
        roles: list = None,
        extra_claims: Dict[str, Any] = None
    ) -> str:
        """
        Génère un token JWT
        
        Args:
            user_id: ID de l'utilisateur
            email: Email de l'utilisateur
            roles: Rôles de l'utilisateur
            extra_claims: Claims additionnels
        
        Returns:
            Token JWT
        """
        now = datetime.utcnow()
        
        payload = {
            'user_id': user_id,
            'email': email,
            'roles': roles or ['user'],
            'iat': now,
            'exp': now + timedelta(minutes=self.jwt_expiration),
            'jti': secrets.token_hex(16)  # JWT ID unique
        }
        
        if extra_claims:
            payload.update(extra_claims)
        
        token = jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
        
        self._audit_log('JWT_CREATED', {
            'user_id': user_id,
            'email': email,
            'expiry': payload['exp'].isoformat()
        })
        
        return token
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Vérifie et décode un token JWT
        
        Args:
            token: Token JWT
        
        Returns:
            Payload du token ou None si invalide
        """
        try:
            payload = jwt.decode(
                token, 
                self.jwt_secret, 
                algorithms=[self.jwt_algorithm]
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            self.logger.warning("Token JWT expiré")
            return None
        except jwt.InvalidTokenError as e:
            self.logger.warning(f"Token JWT invalide : {e}")
            return None
    
    def require_auth(self, roles: list = None):
        """
        Décorateur pour protéger une route avec authentification JWT
        
        Args:
            roles: Rôles requis (optionnel)
        
        Example:
            @app.route('/protected')
            @security.require_auth(roles=['admin'])
            def protected_route():
                return jsonify({'message': 'OK'})
        """
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Récupérer le token depuis le header Authorization
                auth_header = request.headers.get('Authorization', '')
                
                if not auth_header.startswith('Bearer '):
                    return jsonify({'error': 'Token manquant'}), 401
                
                token = auth_header.split(' ')[1]
                
                # Vérifier le token
                payload = self.verify_jwt_token(token)
                
                if not payload:
                    return jsonify({'error': 'Token invalide ou expiré'}), 401
                
                # Vérifier les rôles si spécifiés
                if roles:
                    user_roles = payload.get('roles', [])
                    if not any(role in user_roles for role in roles):
                        return jsonify({'error': 'Permissions insuffisantes'}), 403
                
                # Stocker les infos utilisateur dans le contexte Flask
                g.current_user = payload
                
                return f(*args, **kwargs)
            
            return decorated_function
        return decorator
    
    def rate_limit(
        self, 
        max_requests: Optional[int] = None,
        time_window: int = 60
    ):
        """
        Décorateur pour limiter le taux de requêtes
        
        Args:
            max_requests: Nombre max de requêtes (défaut depuis config)
            time_window: Fenêtre de temps en secondes
        
        Example:
            @app.route('/api/search')
            @security.rate_limit(max_requests=10, time_window=60)
            def search():
                return jsonify({'results': []})
        """
        if max_requests is None:
            max_requests = self.rate_limit_per_minute
        
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated_function(*args, **kwargs):
                if not self.rate_limit_enabled:
                    return f(*args, **kwargs)
                
                # Identifier le client (IP ou user_id)
                client_id = self._get_client_identifier()
                
                # Nettoyer les anciennes requêtes
                now = time.time()
                self.rate_limit_storage[client_id] = [
                    timestamp 
                    for timestamp in self.rate_limit_storage[client_id]
                    if now - timestamp < time_window
                ]
                
                # Vérifier le nombre de requêtes
                if len(self.rate_limit_storage[client_id]) >= max_requests:
                    self._audit_log('RATE_LIMIT_EXCEEDED', {
                        'client_id': client_id,
                        'requests': len(self.rate_limit_storage[client_id])
                    })
                    
                    return jsonify({
                        'error': 'Trop de requêtes',
                        'retry_after': time_window
                    }), 429
                
                # Enregistrer la requête
                self.rate_limit_storage[client_id].append(now)
                
                return f(*args, **kwargs)
            
            return decorated_function
        return decorator
    
    def generate_csrf_token(self, session_id: str) -> str:
        """
        Génère un token CSRF
        
        Args:
            session_id: ID de session
        
        Returns:
            Token CSRF
        """
        token = secrets.token_urlsafe(32)
        self.csrf_tokens[session_id] = (token, datetime.now() + self.csrf_token_expiry)
        
        return token
    
    def verify_csrf_token(self, session_id: str, token: str) -> bool:
        """
        Vérifie un token CSRF
        
        Args:
            session_id: ID de session
            token: Token CSRF à vérifier
        
        Returns:
            True si valide
        """
        if session_id not in self.csrf_tokens:
            return False
        
        stored_token, expiry = self.csrf_tokens[session_id]
        
        # Vérifier expiration
        if datetime.now() > expiry:
            del self.csrf_tokens[session_id]
            return False
        
        # Comparaison sécurisée
        return secrets.compare_digest(token, stored_token)
    
    def validate_input(self, data: Any) -> bool:
        """
        Valide les entrées utilisateur contre les injections
        
        Args:
            data: Données à valider (str, dict, list)
        
        Returns:
            True si sûr, False si suspect
        """
        import re
        
        def check_string(s: str) -> bool:
            """Vérifie une chaîne contre les patterns suspects"""
            for pattern in self.suspicious_patterns:
                if re.search(pattern, s):
                    self.logger.warning(f"Pattern suspect détecté : {pattern}")
                    return False
            return True
        
        # Vérifier selon le type
        if isinstance(data, str):
            return check_string(data)
        
        elif isinstance(data, dict):
            for key, value in data.items():
                if not self.validate_input(key) or not self.validate_input(value):
                    return False
        
        elif isinstance(data, list):
            for item in data:
                if not self.validate_input(item):
                    return False
        
        return True
    
    def sanitize_input(self, data: str) -> str:
        """
        Nettoie les entrées utilisateur
        
        Args:
            data: Données à nettoyer
        
        Returns:
            Données nettoyées
        """
        import html
        
        # Échapper HTML
        sanitized = html.escape(data)
        
        # Retirer les caractères de contrôle
        sanitized = ''.join(char for char in sanitized if ord(char) >= 32 or char in '\n\r\t')
        
        return sanitized
    
    def audit_request(self):
        """
        Décorateur pour auditer toutes les requêtes
        
        Example:
            @app.before_request
            @security.audit_request()
            def before_request():
                pass
        """
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated_function(*args, **kwargs):
                if self.audit_enabled:
                    self._audit_log('REQUEST', {
                        'method': request.method,
                        'path': request.path,
                        'client_id': self._get_client_identifier(),
                        'user_agent': request.headers.get('User-Agent', 'Unknown')
                    })
                
                return f(*args, **kwargs)
            
            return decorated_function
        return decorator
    
    def _get_client_identifier(self) -> str:
        """Récupère un identifiant unique du client"""
        # Priorité : user_id du JWT > IP
        if hasattr(g, 'current_user'):
            return g.current_user.get('user_id', request.remote_addr)
        
        # Gérer les proxies (X-Forwarded-For)
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        return request.remote_addr or 'unknown'
    
    def _audit_log(self, action: str, metadata: Dict[str, Any]) -> None:
        """
        Enregistre une entrée d'audit
        
        Args:
            action: Type d'action
            metadata: Métadonnées
        """
        if not self.audit_enabled:
            return
        
        audit_entry = {
            'timestamp': datetime.now().isoformat(),
            'action': action,
            'metadata': metadata
        }
        
        try:
            # Charger l'audit existant
            if self.audit_file.exists():
                with open(self.audit_file, 'r') as f:
                    audit_data = json.load(f)
            else:
                audit_data = {'entries': []}
            
            # Ajouter l'entrée
            audit_data['entries'].append(audit_entry)
            
            # Rotation (garder 10000 dernières entrées)
            if len(audit_data['entries']) > 10000:
                audit_data['entries'] = audit_data['entries'][-10000:]
            
            # Sauvegarder
            self.audit_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.audit_file, 'w') as f:
                json.dump(audit_data, f, indent=2)
        
        except Exception as e:
            self.logger.error(f"Erreur audit : {e}")
    
    def get_audit_logs(
        self, 
        limit: int = 100,
        action_filter: Optional[str] = None
    ) -> list:
        """
        Récupère les logs d'audit
        
        Args:
            limit: Nombre max d'entrées
            action_filter: Filtrer par type d'action
        
        Returns:
            Liste des entrées d'audit
        """
        if not self.audit_file.exists():
            return []
        
        try:
            with open(self.audit_file, 'r') as f:
                content = f.read()
                if not content.strip():
                    return []
                audit_data = json.loads(content)
            
            # S'assurer que la structure est correcte
            if not isinstance(audit_data, dict):
                return []
            
            entries = audit_data.get('entries', [])
            
            # S'assurer que entries est une liste
            if not isinstance(entries, list):
                return []
            
            # Filtrer par action si spécifié
            if action_filter:
                entries = [
                    entry for entry in entries
                    if isinstance(entry, dict) and entry.get('action') == action_filter
                ]
            
            # Retourner les dernières entrées
            return entries[-limit:]
        
        except Exception as e:
            self.logger.error(f"Erreur lecture audit : {e}")
            return []


# Instance globale
_security_middleware_instance: Optional[SecurityMiddleware] = None


def get_security() -> SecurityMiddleware:
    """Récupère l'instance singleton du middleware de sécurité"""
    global _security_middleware_instance
    
    if _security_middleware_instance is None:
        _security_middleware_instance = SecurityMiddleware()
    
    return _security_middleware_instance
