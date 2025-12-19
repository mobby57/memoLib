"""Gestionnaire de sessions sécurisé"""
from flask import session
import time
import secrets

class SessionManager:
    def __init__(self, app_dir):
        self.app_dir = app_dir
        self.session_timeout = 3600  # 1 heure
    
    def create_session(self, master_password):
        """Créer une session sécurisée"""
        session['authenticated'] = True
        session['master_password'] = master_password
        session['created_at'] = time.time()
        session['token'] = secrets.token_hex(16)
        return True
    
    def validate_session(self):
        """Valider la session actuelle"""
        if not session.get('authenticated'):
            return False
        
        created_at = session.get('created_at', 0)
        if time.time() - created_at > self.session_timeout:
            self.destroy_session()
            return False
        
        return True
    
    def get_master_password(self):
        """Récupérer le mot de passe maître de la session"""
        if self.validate_session():
            return session.get('master_password')
        return None
    
    def destroy_session(self):
        """Détruire la session"""
        session.clear()
        return True