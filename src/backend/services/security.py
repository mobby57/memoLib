"""
Security Service for IA Poste Manager

Handles authentication, authorization, and data security
"""

import logging
import hashlib
import jwt
import secrets
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class UserRole(str, Enum):
    """Rôles utilisateur"""
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class Permission(str, Enum):
    """Permissions système"""
    READ_WORKSPACE = "read_workspace"
    CREATE_WORKSPACE = "create_workspace"
    MODIFY_WORKSPACE = "modify_workspace"
    DELETE_WORKSPACE = "delete_workspace"
    USE_AI_PREMIUM = "use_ai_premium"
    ACCESS_ANALYTICS = "access_analytics"


class SecurityService:
    """Service de sécurité et authentification"""

    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or secrets.token_urlsafe(32)
        self.active_sessions = {}
        
        # Configuration des permissions par rôle
        self.role_permissions = {
            UserRole.ADMIN: [
                Permission.READ_WORKSPACE,
                Permission.CREATE_WORKSPACE,
                Permission.MODIFY_WORKSPACE,
                Permission.DELETE_WORKSPACE,
                Permission.USE_AI_PREMIUM,
                Permission.ACCESS_ANALYTICS
            ],
            UserRole.USER: [
                Permission.READ_WORKSPACE,
                Permission.CREATE_WORKSPACE,
                Permission.MODIFY_WORKSPACE,
                Permission.USE_AI_PREMIUM
            ],
            UserRole.GUEST: [
                Permission.READ_WORKSPACE,
                Permission.CREATE_WORKSPACE
            ]
        }

    async def validate_user(self, user_id: str, token: str = None) -> Dict[str, Any]:
        """
        Valide un utilisateur et retourne ses informations
        
        Args:
            user_id: ID de l'utilisateur
            token: Token JWT optionnel
            
        Returns:
            Informations utilisateur validées
        """
        try:
            if token:
                # Validation via JWT
                payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
                if payload.get('user_id') != user_id:
                    raise ValueError("Token user_id mismatch")
                
                return {
                    'user_id': user_id,
                    'role': payload.get('role', UserRole.GUEST),
                    'plan': payload.get('plan', 'FREE'),
                    'valid': True,
                    'expires_at': payload.get('exp')
                }
            else:
                # Validation basique (mode développement)
                return {
                    'user_id': user_id,
                    'role': UserRole.USER,
                    'plan': 'FREE',
                    'valid': True,
                    'expires_at': None
                }
                
        except jwt.ExpiredSignatureError:
            logger.warning(f"Expired token for user {user_id}")
            return {'valid': False, 'error': 'Token expired'}
        except jwt.InvalidTokenError:
            logger.warning(f"Invalid token for user {user_id}")
            return {'valid': False, 'error': 'Invalid token'}
        except Exception as e:
            logger.error(f"Error validating user {user_id}: {str(e)}")
            return {'valid': False, 'error': str(e)}

    async def check_permissions(
        self, 
        user_id: str, 
        action: str, 
        resource: str = None
    ) -> bool:
        """
        Vérifie les permissions d'un utilisateur pour une action
        
        Args:
            user_id: ID de l'utilisateur
            action: Action demandée
            resource: Ressource concernée (optionnel)
            
        Returns:
            True si autorisé, False sinon
        """
        try:
            # Récupérer les infos utilisateur
            user_info = await self.validate_user(user_id)
            if not user_info.get('valid', False):
                return False
            
            user_role = UserRole(user_info.get('role', UserRole.GUEST))
            user_permissions = self.role_permissions.get(user_role, [])
            
            # Vérifier la permission
            required_permission = Permission(action)
            has_permission = required_permission in user_permissions
            
            # Vérifications supplémentaires selon le contexte
            if action == Permission.USE_AI_PREMIUM:
                user_plan = user_info.get('plan', 'FREE')
                has_permission = has_permission and user_plan in ['PREMIUM', 'ENTERPRISE']
            
            logger.info(f"Permission check: user={user_id}, action={action}, allowed={has_permission}")
            return has_permission
            
        except Exception as e:
            logger.error(f"Error checking permissions for {user_id}: {str(e)}")
            return False

    async def encrypt_data(self, data: str, salt: str = None) -> Dict[str, str]:
        """
        Chiffre des données sensibles
        
        Args:
            data: Données à chiffrer
            salt: Salt optionnel
            
        Returns:
            Données chiffrées avec salt
        """
        try:
            if salt is None:
                salt = secrets.token_hex(16)
            
            # Hash SHA-256 avec salt
            hash_obj = hashlib.sha256()
            hash_obj.update((data + salt).encode('utf-8'))
            encrypted = hash_obj.hexdigest()
            
            return {
                'encrypted': encrypted,
                'salt': salt,
                'algorithm': 'sha256'
            }
            
        except Exception as e:
            logger.error(f"Error encrypting data: {str(e)}")
            raise

    async def verify_encrypted_data(
        self, 
        data: str, 
        encrypted: str, 
        salt: str
    ) -> bool:
        """
        Vérifie des données chiffrées
        
        Args:
            data: Données originales
            encrypted: Données chiffrées
            salt: Salt utilisé
            
        Returns:
            True si les données correspondent
        """
        try:
            result = await self.encrypt_data(data, salt)
            return result['encrypted'] == encrypted
        except Exception as e:
            logger.error(f"Error verifying encrypted data: {str(e)}")
            return False

    async def generate_token(
        self, 
        user_id: str, 
        role: str = "user", 
        plan: str = "FREE",
        expires_hours: int = 24
    ) -> str:
        """
        Génère un token JWT pour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            role: Rôle de l'utilisateur
            plan: Plan de l'utilisateur
            expires_hours: Durée de validité en heures
            
        Returns:
            Token JWT
        """
        try:
            payload = {
                'user_id': user_id,
                'role': role,
                'plan': plan,
                'iat': datetime.utcnow(),
                'exp': datetime.utcnow() + timedelta(hours=expires_hours)
            }
            
            token = jwt.encode(payload, self.secret_key, algorithm='HS256')
            
            # Stocker la session
            self.active_sessions[user_id] = {
                'token': token,
                'created_at': datetime.utcnow().isoformat(),
                'expires_at': payload['exp'].isoformat(),
                'role': role,
                'plan': plan
            }
            
            return token
            
        except Exception as e:
            logger.error(f"Error generating token for {user_id}: {str(e)}")
            raise

    async def revoke_token(self, user_id: str) -> bool:
        """
        Révoque le token d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            True si révoqué avec succès
        """
        try:
            if user_id in self.active_sessions:
                del self.active_sessions[user_id]
                logger.info(f"Token revoked for user {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error revoking token for {user_id}: {str(e)}")
            return False

    async def rate_limit_check(
        self, 
        user_id: str, 
        action: str, 
        limit_per_hour: int = 100
    ) -> Dict[str, Any]:
        """
        Vérifie les limites de taux pour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            action: Action effectuée
            limit_per_hour: Limite par heure
            
        Returns:
            Informations sur le rate limiting
        """
        try:
            # Implémentation basique - à améliorer avec Redis
            current_hour = datetime.utcnow().strftime('%Y-%m-%d-%H')
            key = f"{user_id}:{action}:{current_hour}"
            
            # Pour l'instant, toujours autoriser (à implémenter avec cache)
            return {
                'allowed': True,
                'remaining': limit_per_hour - 1,
                'reset_time': (datetime.utcnow() + timedelta(hours=1)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in rate limit check: {str(e)}")
            return {'allowed': False, 'error': str(e)}

    async def audit_log(
        self, 
        user_id: str, 
        action: str, 
        resource: str = None,
        details: Dict[str, Any] = None
    ) -> None:
        """
        Enregistre une action dans les logs d'audit
        
        Args:
            user_id: ID de l'utilisateur
            action: Action effectuée
            resource: Ressource concernée
            details: Détails supplémentaires
        """
        try:
            audit_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'action': action,
                'resource': resource,
                'details': details or {},
                'ip_address': 'unknown',  # À récupérer depuis la requête
                'user_agent': 'unknown'   # À récupérer depuis la requête
            }
            
            logger.info(f"AUDIT: {audit_entry}")
            
        except Exception as e:
            logger.error(f"Error in audit log: {str(e)}")