"""Gestionnaire d'utilisateurs"""
import os
import json
import hashlib
from datetime import datetime

class UserManager:
    def __init__(self, app_dir=None):
        self.app_dir = app_dir or "data"
        self.users_file = os.path.join(self.app_dir, 'users.json')
        self.ensure_users_file()
    
    def ensure_users_file(self):
        """S'assure que le fichier utilisateurs existe"""
        if not os.path.exists(self.users_file):
            default_users = {
                "users": []
            }
            
            os.makedirs(os.path.dirname(self.users_file), exist_ok=True)
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump(default_users, f, indent=2, ensure_ascii=False)
    
    def get_users(self):
        """Récupère tous les utilisateurs"""
        try:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('users', [])
        except:
            return []
    
    def create_user(self, username, email, password, role='user'):
        """Crée un nouvel utilisateur"""
        try:
            users = self.get_users()
            
            # Vérifier si l'utilisateur existe déjà
            for user in users:
                if user.get('username') == username or user.get('email') == email:
                    return False, "Utilisateur déjà existant"
            
            # Hasher le mot de passe
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            new_user = {
                "id": len(users) + 1,
                "username": username,
                "email": email,
                "password_hash": password_hash,
                "role": role,
                "created_at": datetime.now().isoformat(),
                "active": True
            }
            
            users.append(new_user)
            
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump({"users": users}, f, indent=2, ensure_ascii=False)
            
            return True, "Utilisateur créé avec succès"
        except Exception as e:
            return False, f"Erreur création utilisateur: {str(e)}"
    
    def authenticate_user(self, username, password):
        """Authentifie un utilisateur"""
        users = self.get_users()
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        for user in users:
            if (user.get('username') == username or user.get('email') == username):
                if user.get('password_hash') == password_hash and user.get('active'):
                    return True, user
        
        return False, None
    
    def get_user_by_id(self, user_id):
        """Récupère un utilisateur par son ID"""
        users = self.get_users()
        for user in users:
            if user.get('id') == user_id:
                return user
        return None