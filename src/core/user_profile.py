"""Gestionnaire de profil utilisateur pour l'envoi d'emails"""
import os
import json
from src.core.user_manager import UserManager

class UserProfile:
    def __init__(self, app_dir=None):
        self.user_manager = UserManager(app_dir)
        self.app_dir = app_dir or "data"
        self.profiles_file = os.path.join(self.app_dir, 'user_profiles.json')
        self.ensure_profiles_file()
    
    def ensure_profiles_file(self):
        """S'assure que le fichier des profils existe"""
        if not os.path.exists(self.profiles_file):
            default_profiles = {"profiles": {}}
            os.makedirs(os.path.dirname(self.profiles_file), exist_ok=True)
            with open(self.profiles_file, 'w', encoding='utf-8') as f:
                json.dump(default_profiles, f, indent=2, ensure_ascii=False)
    
    def get_user_display_name(self, user_id):
        """Récupère le nom d'affichage complet de l'utilisateur"""
        try:
            # Récupérer les infos utilisateur de base
            user = self.user_manager.get_user_by_id(user_id)
            if not user:
                return None
            
            # Récupérer le profil étendu
            with open(self.profiles_file, 'r', encoding='utf-8') as f:
                profiles = json.load(f)
            
            profile = profiles.get('profiles', {}).get(str(user_id), {})
            
            # Construire le nom d'affichage
            first_name = profile.get('first_name', '')
            last_name = profile.get('last_name', '')
            
            if first_name and last_name:
                return f"{first_name} {last_name}"
            elif first_name:
                return first_name
            elif last_name:
                return last_name
            else:
                # Fallback sur le username
                return user.get('username', user.get('email', '').split('@')[0])
                
        except Exception:
            return None
    
    def update_user_profile(self, user_id, first_name=None, last_name=None, display_name=None):
        """Met à jour le profil utilisateur"""
        try:
            with open(self.profiles_file, 'r', encoding='utf-8') as f:
                profiles = json.load(f)
            
            if 'profiles' not in profiles:
                profiles['profiles'] = {}
            
            user_profile = profiles['profiles'].get(str(user_id), {})
            
            if first_name is not None:
                user_profile['first_name'] = first_name
            if last_name is not None:
                user_profile['last_name'] = last_name
            if display_name is not None:
                user_profile['display_name'] = display_name
            
            profiles['profiles'][str(user_id)] = user_profile
            
            with open(self.profiles_file, 'w', encoding='utf-8') as f:
                json.dump(profiles, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception:
            return False
    
    def get_user_email_signature(self, user_id):
        """Récupère la signature email de l'utilisateur"""
        try:
            with open(self.profiles_file, 'r', encoding='utf-8') as f:
                profiles = json.load(f)
            
            profile = profiles.get('profiles', {}).get(str(user_id), {})
            return profile.get('email_signature', '')
        except Exception:
            return ''