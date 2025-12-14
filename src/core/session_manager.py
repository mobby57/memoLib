"""Gestionnaire de sessions sécurisé"""
import os
import json
import time
from datetime import datetime, timedelta

class SessionManager:
    def __init__(self, app_dir):
        self.app_dir = app_dir
        self.session_file = os.path.join(app_dir, 'sessions.json')
        self.master_password = None
        self.session_timeout = 3600  # 1 heure
    
    def set_master_password(self, password):
        """Définit le mot de passe maître en mémoire"""
        self.master_password = password
    
    def get_master_password(self):
        """Récupère le mot de passe maître"""
        return self.master_password
    
    def validate_session(self):
        """Valide la session courante"""
        return self.master_password is not None
    
    def clear_session(self):
        """Nettoie la session"""
        self.master_password = None
    
    def create_session(self, user_id, data=None):
        """Crée une nouvelle session"""
        session_data = {
            'user_id': user_id,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(seconds=self.session_timeout)).isoformat(),
            'data': data or {}
        }
        
        sessions = self.load_sessions()
        session_id = f"session_{int(time.time())}"
        sessions[session_id] = session_data
        self.save_sessions(sessions)
        
        return session_id
    
    def get_session(self, session_id):
        """Récupère une session"""
        sessions = self.load_sessions()
        session = sessions.get(session_id)
        
        if session:
            expires_at = datetime.fromisoformat(session['expires_at'])
            if datetime.now() > expires_at:
                # Session expirée
                del sessions[session_id]
                self.save_sessions(sessions)
                return None
        
        return session
    
    def load_sessions(self):
        """Charge les sessions depuis le fichier"""
        if os.path.exists(self.session_file):
            try:
                with open(self.session_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {}
    
    def save_sessions(self, sessions):
        """Sauvegarde les sessions"""
        try:
            with open(self.session_file, 'w') as f:
                json.dump(sessions, f, indent=2)
        except Exception:
            pass