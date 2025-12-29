"""
Gestionnaire d'accès sécurisé aux documents
Authentification high-level avec JWT + Permissions granulaires
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict
import jwt
import hashlib
import secrets


class DocumentAccessManager:
    """
    Gestion accès sécurisé aux documents
    - JWT tokens pour accès temporaire
    - Permissions granulaires (read, write, delete, share)
    - Rôles utilisateurs (user, admin, viewer)
    - Logs d'accès pour audit
    """
    
    SECRET_KEY = secrets.token_hex(32)  # Généré aléatoirement (à mettre en .env en prod)
    TOKEN_EXPIRATION_HOURS = 24
    
    def __init__(self, db_session=None):
        self.db = db_session
        self.access_logs = []  # Logs d'accès
        self.document_permissions = {}  # {document_id: {user_id: [permissions]}}
        self.user_roles = {}  # {user_id: role}
    
    def create_access_token(self, user_id: int, document_id: int, 
                           permissions: List[str] = None, 
                           expires_hours: int = None) -> str:
        """
        Crée un token JWT pour accès temporaire à un document
        
        Args:
            user_id: ID de l'utilisateur
            document_id: ID du document
            permissions: Liste de permissions (read, write, delete, share)
            expires_hours: Durée de validité en heures (défaut: 24h)
        
        Returns:
            Token JWT signé
        """
        if expires_hours is None:
            expires_hours = self.TOKEN_EXPIRATION_HOURS
        
        if permissions is None:
            permissions = ['read']  # Par défaut: lecture seule
        
        payload = {
            'user_id': user_id,
            'document_id': document_id,
            'permissions': permissions,
            'exp': datetime.utcnow() + timedelta(hours=expires_hours),
            'iat': datetime.utcnow(),
            'jti': secrets.token_hex(16)  # JWT ID unique
        }
        
        token = jwt.encode(payload, self.SECRET_KEY, algorithm='HS256')
        
        self._log_access(user_id, document_id, 'token_created', {
            'permissions': permissions,
            'expires_in_hours': expires_hours
        })
        
        return token
    
    def verify_access_token(self, token: str) -> Optional[Dict]:
        """
        Vérifie validité d'un token et retourne ses informations
        
        Args:
            token: Token JWT à vérifier
        
        Returns:
            Dict avec user_id, document_id, permissions ou None si invalide
        """
        try:
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=['HS256'])
            
            self._log_access(
                payload['user_id'], 
                payload['document_id'], 
                'token_verified',
                {'permissions': payload.get('permissions', [])}
            )
            
            return {
                'user_id': payload['user_id'],
                'document_id': payload['document_id'],
                'permissions': payload.get('permissions', []),
                'expires_at': datetime.fromtimestamp(payload['exp']).isoformat()
            }
            
        except jwt.ExpiredSignatureError:
            print("❌ Token expiré")
            return None
        except jwt.InvalidTokenError as e:
            print(f"❌ Token invalide: {e}")
            return None
    
    def has_permission(self, user_id: int, document_id: int, 
                      required_permission: str, token: str = None) -> bool:
        """
        Vérifie si un utilisateur a une permission spécifique sur un document
        
        Args:
            user_id: ID de l'utilisateur
            document_id: ID du document
            required_permission: Permission requise (read, write, delete, share)
            token: Token JWT (optionnel, si accès via token)
        
        Returns:
            True si permission accordée, False sinon
        """
        
        # 1. Vérifier via token si fourni
        if token:
            token_data = self.verify_access_token(token)
            if token_data and \
               token_data['user_id'] == user_id and \
               token_data['document_id'] == document_id and \
               required_permission in token_data['permissions']:
                return True
        
        # 2. Vérifier rôle admin (accès total)
        if self.get_user_role(user_id) == 'admin':
            return True
        
        # 3. Vérifier permissions explicites
        doc_perms = self.document_permissions.get(document_id, {})
        user_perms = doc_perms.get(user_id, [])
        
        if required_permission in user_perms:
            return True
        
        # 4. Permission 'read' par défaut pour propriétaire
        if required_permission == 'read':
            # Simuler: user 1 est propriétaire de tous les docs
            # En prod: vérifier document.owner_id == user_id
            return True
        
        self._log_access(user_id, document_id, 'permission_denied', {
            'required': required_permission
        })
        
        return False
    
    def grant_permission(self, document_id: int, user_id: int, 
                        permissions: List[str], granted_by: int = None):
        """
        Accorde des permissions à un utilisateur sur un document
        
        Args:
            document_id: ID du document
            user_id: ID de l'utilisateur à qui donner accès
            permissions: Liste de permissions à accorder
            granted_by: ID de l'utilisateur qui accorde (pour audit)
        """
        if document_id not in self.document_permissions:
            self.document_permissions[document_id] = {}
        
        # Ajouter permissions
        current_perms = set(self.document_permissions[document_id].get(user_id, []))
        current_perms.update(permissions)
        self.document_permissions[document_id][user_id] = list(current_perms)
        
        self._log_access(user_id, document_id, 'permission_granted', {
            'permissions': permissions,
            'granted_by': granted_by
        })
        
        print(f"✅ Permissions accordées à user {user_id} sur doc {document_id}: {permissions}")
    
    def revoke_permission(self, document_id: int, user_id: int, 
                         permissions: List[str] = None):
        """
        Révoque des permissions d'un utilisateur
        
        Args:
            document_id: ID du document
            user_id: ID de l'utilisateur
            permissions: Liste de permissions à révoquer (si None, tout révoquer)
        """
        if document_id not in self.document_permissions:
            return
        
        if permissions is None:
            # Révoquer toutes les permissions
            if user_id in self.document_permissions[document_id]:
                del self.document_permissions[document_id][user_id]
                self._log_access(user_id, document_id, 'all_permissions_revoked')
        else:
            # Révoquer permissions spécifiques
            current_perms = set(self.document_permissions[document_id].get(user_id, []))
            current_perms.difference_update(permissions)
            
            if current_perms:
                self.document_permissions[document_id][user_id] = list(current_perms)
            else:
                # Plus aucune permission, supprimer l'entrée
                if user_id in self.document_permissions[document_id]:
                    del self.document_permissions[document_id][user_id]
            
            self._log_access(user_id, document_id, 'permissions_revoked', {
                'revoked': permissions
            })
        
        print(f"🚫 Permissions révoquées pour user {user_id} sur doc {document_id}")
    
    def get_user_permissions(self, user_id: int, document_id: int) -> List[str]:
        """
        Récupère toutes les permissions d'un utilisateur sur un document
        
        Returns:
            Liste de permissions: ['read', 'write', 'delete', 'share']
        """
        # Admin = toutes permissions
        if self.get_user_role(user_id) == 'admin':
            return ['read', 'write', 'delete', 'share']
        
        # Permissions explicites
        doc_perms = self.document_permissions.get(document_id, {})
        user_perms = doc_perms.get(user_id, [])
        
        # Par défaut: lecture pour tous
        if not user_perms and 'read' not in user_perms:
            user_perms = ['read']
        
        return user_perms
    
    def set_user_role(self, user_id: int, role: str):
        """
        Définit le rôle d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            role: 'user', 'admin', 'viewer'
        """
        valid_roles = ['user', 'admin', 'viewer']
        if role not in valid_roles:
            raise ValueError(f"Rôle invalide. Utilisez: {', '.join(valid_roles)}")
        
        self.user_roles[user_id] = role
        print(f"✅ Rôle défini: user {user_id} → {role}")
    
    def get_user_role(self, user_id: int) -> str:
        """Récupère le rôle d'un utilisateur (défaut: 'user')"""
        return self.user_roles.get(user_id, 'user')
    
    def _log_access(self, user_id: int, document_id: int, 
                   action: str, metadata: Dict = None):
        """
        Enregistre un log d'accès pour audit
        """
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id,
            'document_id': document_id,
            'action': action,
            'metadata': metadata or {},
            'ip_address': None,  # En prod: récupérer IP réelle
        }
        
        self.access_logs.append(log_entry)
    
    def get_access_logs(self, user_id: Optional[int] = None, 
                       document_id: Optional[int] = None,
                       limit: int = 100) -> List[Dict]:
        """
        Récupère les logs d'accès pour audit
        
        Args:
            user_id: Filtrer par utilisateur
            document_id: Filtrer par document
            limit: Nombre max de logs à retourner
        
        Returns:
            Liste de logs d'accès
        """
        logs = self.access_logs
        
        if user_id:
            logs = [l for l in logs if l['user_id'] == user_id]
        
        if document_id:
            logs = [l for l in logs if l['document_id'] == document_id]
        
        # Trier par date décroissante
        logs.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return logs[:limit]
    
    def generate_share_link(self, document_id: int, permissions: List[str] = None,
                           expires_hours: int = 48) -> str:
        """
        Génère un lien de partage public pour un document
        
        Args:
            document_id: ID du document à partager
            permissions: Permissions accordées (défaut: ['read'])
            expires_hours: Durée de validité du lien (défaut: 48h)
        
        Returns:
            URL de partage avec token
        """
        if permissions is None:
            permissions = ['read']
        
        # Créer token avec user_id spécial pour partage public
        share_token = self.create_access_token(
            user_id=0,  # 0 = accès public
            document_id=document_id,
            permissions=permissions,
            expires_hours=expires_hours
        )
        
        # Générer URL (en prod: utiliser vraie URL du serveur)
        share_url = f"https://iapostemanager.com/share/{share_token}"
        
        self._log_access(0, document_id, 'share_link_created', {
            'permissions': permissions,
            'expires_hours': expires_hours
        })
        
        print(f"🔗 Lien de partage créé: {share_url[:50]}...")
        
        return share_url
    
    def validate_share_link(self, share_url: str) -> Optional[Dict]:
        """
        Valide un lien de partage et retourne les informations
        
        Returns:
            Dict avec document_id, permissions, expires_at ou None si invalide
        """
        # Extraire token de l'URL
        try:
            token = share_url.split('/')[-1]
            return self.verify_access_token(token)
        except:
            return None


# ============ EXEMPLE D'UTILISATION ============

if __name__ == "__main__":
    import json
    
    manager = DocumentAccessManager()
    
    # 1. Définir rôles
    manager.set_user_role(1, 'admin')
    manager.set_user_role(2, 'user')
    manager.set_user_role(3, 'viewer')
    
    # 2. Créer token d'accès
    token = manager.create_access_token(
        user_id=2,
        document_id=42,
        permissions=['read', 'write'],
        expires_hours=24
    )
    
    print("\n" + "="*60)
    print("🔐 TOKEN CRÉÉ:")
    print("="*60)
    print(f"Token: {token[:50]}...")
    
    # 3. Vérifier token
    token_data = manager.verify_access_token(token)
    print("\n" + "="*60)
    print("✅ TOKEN VÉRIFIÉ:")
    print("="*60)
    print(json.dumps(token_data, indent=2))
    
    # 4. Vérifier permissions
    has_read = manager.has_permission(2, 42, 'read', token)
    has_delete = manager.has_permission(2, 42, 'delete', token)
    
    print("\n" + "="*60)
    print("🔍 VÉRIFICATION PERMISSIONS:")
    print("="*60)
    print(f"User 2 peut lire doc 42: {has_read}")
    print(f"User 2 peut supprimer doc 42: {has_delete}")
    
    # 5. Accorder permissions
    manager.grant_permission(42, 3, ['read'], granted_by=1)
    
    # 6. Générer lien de partage
    share_url = manager.generate_share_link(42, ['read'], expires_hours=48)
    
    print("\n" + "="*60)
    print("🔗 LIEN DE PARTAGE:")
    print("="*60)
    print(share_url)
    
    # 7. Valider lien
    share_data = manager.validate_share_link(share_url)
    print("\n" + "="*60)
    print("✅ LIEN VALIDÉ:")
    print("="*60)
    print(json.dumps(share_data, indent=2))
    
    # 8. Logs d'accès
    logs = manager.get_access_logs(limit=5)
    print("\n" + "="*60)
    print("📊 DERNIERS LOGS D'ACCÈS:")
    print("="*60)
    for log in logs:
        print(f"{log['timestamp']} - User {log['user_id']} - {log['action']} - Doc {log['document_id']}")
    
    # 9. Révoquer accès
    manager.revoke_permission(42, 3)
    
    # 10. Récupérer permissions user
    perms = manager.get_user_permissions(1, 42)
    print("\n" + "="*60)
    print("📋 PERMISSIONS USER 1 (admin):")
    print("="*60)
    print(perms)
