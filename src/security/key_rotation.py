"""Système de rotation automatique des clés de chiffrement"""
import os
import secrets
import json
from datetime import datetime, timedelta
try:
    from src.core.crypto_utils import _valider_chemin_securise, recuperer_app_password, recuperer_api_key
except ImportError:
    # Fallback si fonction non disponible
    def _valider_chemin_securise(app_dir, filename):
        return os.path.join(app_dir, filename)
    def recuperer_app_password(pwd, dir):
        return None, None
    def recuperer_api_key(pwd, dir):
        return None, None

class KeyRotation:
    def __init__(self, app_dir, rotation_days=90):
        self.app_dir = app_dir
        self.rotation_days = rotation_days
        self.rotation_file = _valider_chemin_securise(app_dir, "key_rotation.json")
    
    def besoin_rotation(self):
        """Vérifie si une rotation est nécessaire"""
        if not os.path.exists(self.rotation_file):
            return True
        
        with open(self.rotation_file, 'r') as f:
            data = json.load(f)
        
        last_rotation = datetime.fromisoformat(data.get('last_rotation', '2000-01-01'))
        return (datetime.now() - last_rotation).days >= self.rotation_days
    
    def effectuer_rotation(self, mot_de_passe_maitre):
        """Effectue la rotation des clés"""
        app_pwd, email = recuperer_app_password(mot_de_passe_maitre, self.app_dir)
        api_key, org_id = recuperer_api_key(mot_de_passe_maitre, self.app_dir)
        
        if not app_pwd and not api_key:
            return False
        
        salt_path = _valider_chemin_securise(self.app_dir, SALT_FILE)
        nouveau_salt = secrets.token_bytes(32)
        
        with open(salt_path, 'wb') as f:
            f.write(nouveau_salt)
        _securiser_fichier(salt_path)
        
        if app_pwd:
            sauvegarder_app_password(app_pwd, mot_de_passe_maitre, self.app_dir, email)
        if api_key:
            sauvegarder_api_key(api_key, org_id, mot_de_passe_maitre, self.app_dir)
        
        self._enregistrer_rotation()
        return True
    
    def _enregistrer_rotation(self):
        """Enregistre la date de rotation"""
        data = {
            'last_rotation': datetime.now().isoformat(),
            'rotation_count': self._get_rotation_count() + 1
        }
        with open(self.rotation_file, 'w') as f:
            json.dump(data, f, indent=2)
        _securiser_fichier(self.rotation_file)
    
    def _get_rotation_count(self):
        """Récupère le nombre de rotations"""
        if not os.path.exists(self.rotation_file):
            return 0
        with open(self.rotation_file, 'r') as f:
            data = json.load(f)
        return data.get('rotation_count', 0)
