"""
🔐 Système d'Authentification et Autorisation de Haut Niveau
Contrôle d'accès aux documents basé sur rôles et permissions
"""
import jwt
import hashlib
import secrets
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from enum import Enum
import sqlite3
import json


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    READONLY = "readonly"


class Permission(str, Enum):
    # Documents
    READ_DOCUMENT = "read_document"
    CREATE_DOCUMENT = "create_document"
    UPDATE_DOCUMENT = "update_document"
    DELETE_DOCUMENT = "delete_document"
    SHARE_DOCUMENT = "share_document"
    
    # TODOs
    READ_TODO = "read_todo"
    CREATE_TODO = "create_todo"
    UPDATE_TODO = "update_todo"
    DELETE_TODO = "delete_todo"
    ASSIGN_TODO = "assign_todo"
    
    # Notifications
    READ_NOTIFICATION = "read_notification"
    SEND_NOTIFICATION = "send_notification"
    
    # Admin
    MANAGE_USERS = "manage_users"
    VIEW_ANALYTICS = "view_analytics"
    SYSTEM_CONFIG = "system_config"


class DocumentAccessLevel(str, Enum):
    PRIVATE = "private"  # Seul le propriétaire
    RESTRICTED = "restricted"  # Propriétaire + personnes spécifiques
    TEAM = "team"  # Équipe
    ORGANIZATION = "organization"  # Organisation entière
    PUBLIC = "public"  # Tous


# Mapping des rôles vers permissions
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.ADMIN: {
        # Accès complet
        *[p for p in Permission]
    },
    UserRole.MANAGER: {
        Permission.READ_DOCUMENT, Permission.CREATE_DOCUMENT, 
        Permission.UPDATE_DOCUMENT, Permission.SHARE_DOCUMENT,
        Permission.READ_TODO, Permission.CREATE_TODO, 
        Permission.UPDATE_TODO, Permission.ASSIGN_TODO,
        Permission.READ_NOTIFICATION, Permission.SEND_NOTIFICATION,
        Permission.VIEW_ANALYTICS
    },
    UserRole.USER: {
        Permission.READ_DOCUMENT, Permission.CREATE_DOCUMENT, 
        Permission.UPDATE_DOCUMENT,
        Permission.READ_TODO, Permission.CREATE_TODO, 
        Permission.UPDATE_TODO,
        Permission.READ_NOTIFICATION
    },
    UserRole.READONLY: {
        Permission.READ_DOCUMENT, Permission.READ_TODO, 
        Permission.READ_NOTIFICATION
    }
}


class AuthenticationManager:
    """Gestionnaire d'authentification et d'autorisation"""
    
    def __init__(self, db_path: str = "data/auth.db", 
                 jwt_secret: Optional[str] = None,
                 jwt_expiry_hours: int = 24):
        self.db_path = db_path
        self.jwt_secret = jwt_secret or secrets.token_urlsafe(32)
        self.jwt_expiry_hours = jwt_expiry_hours
        self._init_db()
    
    def _init_db(self):
        """Initialise la base de données d'authentification"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript('''
                -- Table des utilisateurs
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user',
                    active BOOLEAN DEFAULT 1,
                    created_at TEXT NOT NULL,
                    last_login TEXT,
                    metadata TEXT
                );
                
                -- Table des sessions
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    token_hash TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    last_activity TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                
                -- Table des permissions personnalisées
                CREATE TABLE IF NOT EXISTS user_permissions (
                    user_id TEXT NOT NULL,
                    permission TEXT NOT NULL,
                    granted_by TEXT,
                    granted_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, permission),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                
                -- Table des accès aux documents
                CREATE TABLE IF NOT EXISTS document_access (
                    document_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    access_level TEXT NOT NULL,
                    granted_by TEXT,
                    granted_at TEXT NOT NULL,
                    expires_at TEXT,
                    PRIMARY KEY (document_id, user_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                
                -- Logs d'audit
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    action TEXT NOT NULL,
                    resource_type TEXT,
                    resource_id TEXT,
                    details TEXT,
                    ip_address TEXT,
                    timestamp TEXT NOT NULL
                );
                
                -- Index
                CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
                CREATE INDEX IF NOT EXISTS idx_doc_access_user ON document_access(user_id);
                CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, timestamp);
            ''')
    
    # ========== USER MANAGEMENT ==========
    
    def create_user(self, username: str, email: str, password: str,
                   role: UserRole = UserRole.USER, metadata: Optional[Dict] = None) -> str:
        """Crée un nouvel utilisateur"""
        user_id = f"user_{datetime.now().timestamp()}"
        password_hash = self._hash_password(password)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO users (id, username, email, password_hash, role, created_at, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, username, email, password_hash, role.value,
                datetime.now().isoformat(),
                json.dumps(metadata) if metadata else None
            ))
        
        self._audit_log(user_id, "user_created", "user", user_id)
        return user_id
    
    def authenticate(self, username: str, password: str, 
                    ip_address: Optional[str] = None,
                    user_agent: Optional[str] = None) -> Optional[Dict]:
        """Authentifie un utilisateur et crée une session"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            user = conn.execute(
                "SELECT * FROM users WHERE username = ? AND active = 1",
                (username,)
            ).fetchone()
            
            if not user:
                return None
            
            # Vérifier mot de passe
            if not self._verify_password(password, user["password_hash"]):
                return None
            
            # Créer session et token
            session_id = f"session_{datetime.now().timestamp()}"
            token = self._generate_token(dict(user))
            token_hash = self._hash_token(token)
            expires_at = datetime.now() + timedelta(hours=self.jwt_expiry_hours)
            
            # Sauvegarder session
            conn.execute('''
                INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, 
                                    last_activity, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_id, user["id"], token_hash, expires_at.isoformat(),
                datetime.now().isoformat(), datetime.now().isoformat(),
                ip_address, user_agent
            ))
            
            # Mettre à jour last_login
            conn.execute(
                "UPDATE users SET last_login = ? WHERE id = ?",
                (datetime.now().isoformat(), user["id"])
            )
        
        self._audit_log(user["id"], "login_success", "session", session_id, 
                       {"ip": ip_address, "user_agent": user_agent})
        
        return {
            "user_id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "token": token,
            "expires_at": expires_at.isoformat()
        }
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Vérifie un token JWT et retourne les infos utilisateur"""
        try:
            # Décoder le token
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            user_id = payload.get("user_id")
            
            # Vérifier que la session existe et est valide
            token_hash = self._hash_token(token)
            
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                session = conn.execute('''
                    SELECT * FROM sessions 
                    WHERE user_id = ? AND token_hash = ? AND expires_at > ?
                ''', (user_id, token_hash, datetime.now().isoformat())).fetchone()
                
                if not session:
                    return None
                
                # Mettre à jour last_activity
                conn.execute(
                    "UPDATE sessions SET last_activity = ? WHERE id = ?",
                    (datetime.now().isoformat(), session["id"])
                )
                
                # Récupérer l'utilisateur
                user = conn.execute(
                    "SELECT * FROM users WHERE id = ? AND active = 1",
                    (user_id,)
                ).fetchone()
                
                if not user:
                    return None
                
                return {
                    "user_id": user["id"],
                    "username": user["username"],
                    "email": user["email"],
                    "role": user["role"]
                }
        
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def logout(self, token: str):
        """Déconnecte l'utilisateur en invalidant le token"""
        token_hash = self._hash_token(token)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "DELETE FROM sessions WHERE token_hash = ?",
                (token_hash,)
            )
    
    # ========== AUTHORIZATION ==========
    
    def has_permission(self, user_id: str, permission: Permission) -> bool:
        """Vérifie si un utilisateur a une permission"""
        with sqlite3.connect(self.db_path) as conn:
            # Récupérer le rôle
            user = conn.execute(
                "SELECT role FROM users WHERE id = ? AND active = 1",
                (user_id,)
            ).fetchone()
            
            if not user:
                return False
            
            role = UserRole(user[0])
            
            # Vérifier permission du rôle
            if permission in ROLE_PERMISSIONS.get(role, set()):
                return True
            
            # Vérifier permissions personnalisées
            custom = conn.execute(
                "SELECT permission FROM user_permissions WHERE user_id = ? AND permission = ?",
                (user_id, permission.value)
            ).fetchone()
            
            return custom is not None
    
    def can_access_document(self, user_id: str, document_id: str) -> bool:
        """Vérifie si un utilisateur peut accéder à un document"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            # Admin a toujours accès
            user = conn.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
            if user and user["role"] == UserRole.ADMIN.value:
                return True
            
            # Vérifier accès spécifique
            access = conn.execute('''
                SELECT * FROM document_access 
                WHERE document_id = ? AND user_id = ?
                AND (expires_at IS NULL OR expires_at > ?)
            ''', (document_id, user_id, datetime.now().isoformat())).fetchone()
            
            return access is not None
    
    def grant_document_access(self, document_id: str, user_id: str,
                             access_level: DocumentAccessLevel,
                             granted_by: str,
                             expires_at: Optional[str] = None):
        """Accorde l'accès à un document"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO document_access 
                (document_id, user_id, access_level, granted_by, granted_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                document_id, user_id, access_level.value, granted_by,
                datetime.now().isoformat(), expires_at
            ))
        
        self._audit_log(granted_by, "grant_document_access", "document", document_id,
                       {"target_user": user_id, "level": access_level.value})
    
    def revoke_document_access(self, document_id: str, user_id: str, revoked_by: str):
        """Révoque l'accès à un document"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "DELETE FROM document_access WHERE document_id = ? AND user_id = ?",
                (document_id, user_id)
            )
        
        self._audit_log(revoked_by, "revoke_document_access", "document", document_id,
                       {"target_user": user_id})
    
    # ========== HELPERS ==========
    
    def _hash_password(self, password: str) -> str:
        """Hash un mot de passe avec salt"""
        salt = secrets.token_hex(16)
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return f"{salt}${pwd_hash.hex()}"
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Vérifie un mot de passe"""
        try:
            salt, pwd_hash = password_hash.split('$')
            new_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
            return new_hash.hex() == pwd_hash
        except:
            return False
    
    def _generate_token(self, user: Dict) -> str:
        """Génère un token JWT"""
        payload = {
            "user_id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "exp": datetime.utcnow() + timedelta(hours=self.jwt_expiry_hours),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")
    
    def _hash_token(self, token: str) -> str:
        """Hash un token pour stockage sécurisé"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def _audit_log(self, user_id: Optional[str], action: str,
                   resource_type: Optional[str] = None,
                   resource_id: Optional[str] = None,
                   details: Optional[Dict] = None,
                   ip_address: Optional[str] = None):
        """Enregistre une action dans l'audit log"""
        log_id = f"log_{datetime.now().timestamp()}"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id,
                                      details, ip_address, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                log_id, user_id, action, resource_type, resource_id,
                json.dumps(details) if details else None,
                ip_address, datetime.now().isoformat()
            ))


# Instance globale
auth_manager = AuthenticationManager()


# FastAPI dependency
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user_dependency(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """
    Dependency FastAPI pour obtenir utilisateur actuel
    Usage: current_user = Depends(get_current_user_dependency)
    """
    token = credentials.credentials
    
    # Valider token
    is_valid, payload = auth_manager.validate_token(token)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload
