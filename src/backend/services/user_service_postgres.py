"""
User Service PostgreSQL - Gestion des utilisateurs avec authentification
Utilise PostgreSQL via database_service pour la persistance
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import logging
import hashlib
import secrets
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import jwt

from services.database_service import get_database_service

logger = logging.getLogger(__name__)

# Configuration JWT (à déplacer dans .env en production)
JWT_SECRET = "your-secret-key-change-in-production"  # TODO: Move to .env
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


class UserServicePostgres:
    """Service de gestion des utilisateurs avec PostgreSQL"""
    
    def __init__(self):
        self.db = get_database_service()
    
    # ========================================
    # PASSWORD HASHING
    # ========================================
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
        """
        Hash un mot de passe avec SHA-256 et un salt
        
        Args:
            password: Mot de passe en clair
            salt: Salt optionnel (généré automatiquement si None)
        
        Returns:
            tuple: (password_hash, salt)
        """
        if salt is None:
            salt = secrets.token_hex(32)
        
        # Combiner password + salt et hasher
        combined = f"{password}{salt}".encode('utf-8')
        password_hash = hashlib.sha256(combined).hexdigest()
        
        return password_hash, salt
    
    @staticmethod
    def verify_password(password: str, stored_hash: str, salt: str) -> bool:
        """
        Vérifie un mot de passe contre son hash
        
        Args:
            password: Mot de passe en clair à vérifier
            stored_hash: Hash stocké en base
            salt: Salt utilisé lors du hash
        
        Returns:
            bool: True si password correct, False sinon
        """
        password_hash, _ = UserServicePostgres.hash_password(password, salt)
        return password_hash == stored_hash
    
    # ========================================
    # JWT TOKEN MANAGEMENT
    # ========================================
    
    @staticmethod
    def generate_jwt_token(user_id: int, username: str, role: str) -> str:
        """
        Génère un token JWT pour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            username: Nom d'utilisateur
            role: Rôle ('admin' ou 'user')
        
        Returns:
            str: Token JWT encodé
        """
        payload = {
            'user_id': user_id,
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token
    
    @staticmethod
    def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Décode et valide un token JWT
        
        Args:
            token: Token JWT à décoder
        
        Returns:
            Dict: Payload décodé ou None si invalide
        """
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("⚠️ Token JWT expiré")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"⚠️ Token JWT invalide: {e}")
            return None
    
    # ========================================
    # USER AUTHENTICATION
    # ========================================
    
    def register_user(
        self,
        username: str,
        email: str,
        password: str,
        role: str = "user"
    ) -> Dict[str, Any]:
        """
        Enregistre un nouvel utilisateur
        
        Args:
            username: Nom d'utilisateur unique
            email: Email unique
            password: Mot de passe en clair
            role: Rôle ('admin' ou 'user')
        
        Returns:
            Dict: Utilisateur créé avec token JWT
        
        Raises:
            ValueError: Si username ou email existe déjà
        """
        try:
            # Vérifier si username existe
            existing_user = self.db.get_user_by_username(username)
            if existing_user:
                raise ValueError(f"Username '{username}' déjà utilisé")
            
            # Vérifier si email existe
            existing_email = self.db.get_user_by_email(email)
            if existing_email:
                raise ValueError(f"Email '{email}' déjà utilisé")
            
            # Hasher le password
            password_hash, salt = self.hash_password(password)
            
            # Stocker hash + salt dans preferences
            full_hash = f"{password_hash}:{salt}"
            
            # Créer utilisateur
            user = self.db.create_user(
                username=username,
                email=email,
                password_hash=full_hash,
                role=role,
                preferences={'salt': salt}
            )
            
            # Générer JWT token
            token = self.generate_jwt_token(user['id'], user['username'], user['role'])
            
            logger.info(f"✅ Utilisateur enregistré: {username} ({email})")
            
            user['token'] = token
            if 'password_hash' in user:
                if 'password_hash' in user: del user['password_hash']  # Ne jamais renvoyer le hash
            
            return user
            
        except Exception as e:
            logger.error(f"❌ Erreur enregistrement utilisateur: {e}")
            raise
    
    def authenticate_user(
        self,
        username: str,
        password: str
    ) -> Optional[Dict[str, Any]]:
        """
        Authentifie un utilisateur
        
        Args:
            username: Nom d'utilisateur ou email
            password: Mot de passe en clair
        
        Returns:
            Dict: Utilisateur avec token JWT ou None si auth échoue
        """
        try:
            # Chercher par username ou email (avec password_hash pour auth)
            user = self.db.get_user_for_auth(username)
            
            if not user:
                logger.warning(f"⚠️ Utilisateur non trouvé: {username}")
                return None
            
            # Extraire hash et salt
            stored_hash = user['password_hash']
            if ':' in stored_hash:
                hash_part, salt = stored_hash.split(':', 1)
            else:
                # Ancien format sans salt
                logger.warning(f"⚠️ Format password ancien pour {username}")
                return None
            
            # Vérifier password
            if not self.verify_password(password, hash_part, salt):
                logger.warning(f"⚠️ Mot de passe incorrect pour {username}")
                return None
            
            # Générer nouveau JWT token
            token = self.generate_jwt_token(user['id'], user['username'], user['role'])
            
            logger.info(f"✅ Utilisateur authentifié: {username}")
            
            user['token'] = token
            if 'password_hash' in user: del user['password_hash']
            
            return user
            
        except Exception as e:
            logger.error(f"❌ Erreur authentification: {e}")
            return None
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Vérifie un token JWT et retourne les infos utilisateur
        
        Args:
            token: Token JWT
        
        Returns:
            Dict: Infos utilisateur ou None si token invalide
        """
        payload = self.decode_jwt_token(token)
        if not payload:
            return None
        
        # Vérifier que l'utilisateur existe toujours
        user = self.db.get_user_by_id(payload['user_id'])
        if not user:
            logger.warning(f"⚠️ Utilisateur {payload['user_id']} n'existe plus")
            return None
        
        if 'password_hash' in user: del user['password_hash']
        
        return user
    
    # ========================================
    # USER MANAGEMENT
    # ========================================
    
    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Récupère un utilisateur par ID"""
        try:
            user = self.db.get_user_by_id(user_id)
            if not user:
                return None
            
            if 'password_hash' in user: del user['password_hash']
            return user
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération user {user_id}: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Récupère un utilisateur par email"""
        try:
            user = self.db.get_user_by_email(email)
            if not user:
                return None
            
            if 'password_hash' in user: del user['password_hash']
            return user
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération user par email: {e}")
            return None
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Récupère un utilisateur par username"""
        try:
            user = self.db.get_user_by_username(username)
            if not user:
                return None
            
            if 'password_hash' in user: del user['password_hash']
            return user
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération user par username: {e}")
            return None
    
    def update_user(
        self,
        user_id: int,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Met à jour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            **kwargs: Champs à mettre à jour (email, role, preferences)
                     Pour password, utiliser update_password()
        
        Returns:
            Dict: Utilisateur mis à jour ou None
        """
        try:
            # Ne pas permettre de changer password_hash directement
            if 'password_hash' in kwargs:
                del kwargs['password_hash']
            
            user = self.db.update_user(user_id, **kwargs)
            
            if user:
                logger.info(f"✅ Utilisateur {user_id} mis à jour")
                if 'password_hash' in user: del user['password_hash']
                return user
            else:
                logger.warning(f"⚠️ Utilisateur {user_id} non trouvé")
                return None
                
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour user {user_id}: {e}")
            raise
    
    def update_password(
        self,
        user_id: int,
        old_password: str,
        new_password: str
    ) -> bool:
        """
        Change le mot de passe d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            old_password: Ancien mot de passe pour vérification
            new_password: Nouveau mot de passe
        
        Returns:
            bool: True si succès, False sinon
        """
        try:
            # Récupérer user avec password_hash pour vérification
            user = self.db.get_user_for_auth_by_id(user_id)
            if not user:
                logger.warning(f"⚠️ Utilisateur {user_id} non trouvé")
                return False
            
            # Vérifier ancien password
            stored_hash = user['password_hash']
            if ':' in stored_hash:
                hash_part, salt = stored_hash.split(':', 1)
            else:
                logger.error(f"❌ Format password invalide pour user {user_id}")
                return False
            
            if not self.verify_password(old_password, hash_part, salt):
                logger.warning(f"⚠️ Ancien password incorrect pour user {user_id}")
                return False
            
            # Hasher nouveau password
            new_hash, new_salt = self.hash_password(new_password)
            full_hash = f"{new_hash}:{new_salt}"
            
            # Mettre à jour
            self.db.update_user(
                user_id,
                password_hash=full_hash,
                preferences={'salt': new_salt}
            )
            
            logger.info(f"✅ Password mis à jour pour user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour password user {user_id}: {e}")
            return False
    
    def delete_user(self, user_id: int) -> bool:
        """Supprime un utilisateur (cascade sur workspaces, templates, signatures)"""
        try:
            success = self.db.delete_user(user_id)
            
            if success:
                logger.info(f"✅ Utilisateur {user_id} supprimé (cascade)")
            else:
                logger.warning(f"⚠️ Utilisateur {user_id} non trouvé")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Erreur suppression user {user_id}: {e}")
            raise
    
    def list_users(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Liste tous les utilisateurs
        
        Args:
            role: Filtre optionnel par rôle ('admin' ou 'user')
        
        Returns:
            List[Dict]: Liste des utilisateurs (sans password_hash)
        """
        try:
            users = self.db.list_users(role=role)
            
            for user in users:
                if 'password_hash' in user: del user['password_hash']
            
            return users
            
        except Exception as e:
            logger.error(f"❌ Erreur listage users: {e}")
            raise
    
    # ========================================
    # PREFERENCES MANAGEMENT
    # ========================================
    
    def update_preferences(
        self,
        user_id: int,
        preferences: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Met à jour les préférences d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            preferences: Dictionnaire de préférences
        
        Returns:
            Dict: Utilisateur mis à jour
        """
        try:
            user = self.db.get_user_by_id(user_id)
            if not user:
                return None
            
            # Merge avec préférences existantes
            current_prefs = user.get('preferences') or {}
            current_prefs.update(preferences)
            
            return self.update_user(user_id, preferences=current_prefs)
            
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour préférences user {user_id}: {e}")
            raise
    
    def get_preference(
        self,
        user_id: int,
        key: str,
        default: Any = None
    ) -> Any:
        """
        Récupère une préférence spécifique
        
        Args:
            user_id: ID de l'utilisateur
            key: Clé de la préférence
            default: Valeur par défaut si non trouvée
        
        Returns:
            Any: Valeur de la préférence ou default
        """
        try:
            user = self.db.get_user_by_id(user_id)
            if not user or not user.get('preferences'):
                return default
            
            return user['preferences'].get(key, default)
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération préférence user {user_id}: {e}")
            return default


# Instance globale (singleton)
_user_service = None

def get_user_service() -> UserServicePostgres:
    """
    Récupère l'instance singleton du UserServicePostgres
    
    Usage:
        from services.user_service_postgres import get_user_service
        us = get_user_service()
        user = us.register_user("john", "john@example.com", "password123")
    """
    global _user_service
    if _user_service is None:
        _user_service = UserServicePostgres()
    return _user_service
