"""
Service d'authentification refactorisé
"""
from datetime import datetime, timedelta
from flask import session
import os
from ..security_improvements import security

class AuthService:
    def __init__(self, crypto_service):
        self.crypto = crypto_service
        self.max_attempts = 5
        self.lockout_duration = 300  # 5 minutes
    
    def authenticate(self, password):
        """Authentifier un utilisateur"""
        # Vérifier les tentatives échouées
        ip = self._get_client_ip()
        if self._is_locked_out(ip):
            return {'success': False, 'error': 'Compte temporairement verrouillé'}
        
        # Vérifier le mot de passe
        if len(password) < 8:
            self._record_failed_attempt(ip)
            return {'success': False, 'error': 'Mot de passe trop court'}
        
        # Vérifier si des credentials existent
        if os.path.exists(self.crypto.creds_file):
            creds = self.crypto.get_credentials(password)
            if not creds:
                self._record_failed_attempt(ip)
                return {'success': False, 'error': 'Mot de passe incorrect'}
        
        # Authentification réussie
        self._clear_failed_attempts(ip)
        self._create_session(password)
        
        return {
            'success': True,
            'token': self._generate_token(password),
            'expires_at': (datetime.now() + timedelta(hours=1)).isoformat()
        }
    
    def logout(self):
        """Déconnecter l'utilisateur"""
        session.clear()
        return {'success': True}
    
    def is_authenticated(self):
        """Vérifier si l'utilisateur est authentifié"""
        return session.get('authenticated', False) and session.get('master_password')
    
    def get_master_password(self):
        """Obtenir le mot de passe maître de la session"""
        return session.get('master_password')
    
    def _create_session(self, password):
        """Créer une session utilisateur"""
        session['master_password'] = password
        session['authenticated'] = True
        session['login_time'] = datetime.now().isoformat()
        session.permanent = True
    
    def _generate_token(self, password):
        """Générer un token d'authentification"""
        import hashlib
        return 'token-' + hashlib.sha256(password.encode()).hexdigest()[:16]
    
    def _get_client_ip(self):
        """Obtenir l'IP du client"""
        from flask import request
        return request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
    
    def _is_locked_out(self, ip):
        """Vérifier si l'IP est verrouillée"""
        if ip not in security.failed_attempts:
            return False
        
        attempts = security.failed_attempts[ip]
        if len(attempts) < self.max_attempts:
            return False
        
        # Vérifier si le verrouillage a expiré
        last_attempt = max(attempts)
        if datetime.now() - last_attempt > timedelta(seconds=self.lockout_duration):
            security.failed_attempts[ip] = []
            return False
        
        return True
    
    def _record_failed_attempt(self, ip):
        """Enregistrer une tentative échouée"""
        if ip not in security.failed_attempts:
            security.failed_attempts[ip] = []
        
        security.failed_attempts[ip].append(datetime.now())
        
        # Garder seulement les tentatives récentes
        cutoff = datetime.now() - timedelta(seconds=self.lockout_duration)
        security.failed_attempts[ip] = [
            attempt for attempt in security.failed_attempts[ip]
            if attempt > cutoff
        ]
    
    def _clear_failed_attempts(self, ip):
        """Effacer les tentatives échouées"""
        if ip in security.failed_attempts:
            del security.failed_attempts[ip]