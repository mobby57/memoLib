"""
Database Service - Wrapper CRUD pour PostgreSQL
Fournit une interface simplifiée pour toutes les opérations de base de données
"""
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from contextlib import contextmanager

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import and_, or_, desc, text

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.backend.models.database import (
    User, Workspace, Message, Template, Signature,
    WorkspaceStatus, WorkspacePriority, MessageRole,
    create_engine_and_session, get_session
)

logger = logging.getLogger(__name__)


class DatabaseService:
    """
    Service central pour toutes les opérations PostgreSQL
    Gère les sessions, transactions et erreurs
    """
    
    def __init__(self):
        """Initialise le service avec la session factory"""
        engine, self.SessionFactory = create_engine_and_session()
    
    @contextmanager
    def get_db_session(self):
        """
        Context manager pour gérer automatiquement les sessions
        Usage: with db.get_db_session() as session: ...
        """
        session = self.SessionFactory()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"❌ Erreur database, rollback: {e}")
            raise
        finally:
            session.close()
    
    # ========================================
    # USER OPERATIONS
    # ========================================
    
    def create_user(self, username: str, email: str, password_hash: str, 
                   role: str = "user", preferences: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Crée un nouvel utilisateur
        
        Args:
            username: Nom d'utilisateur unique
            email: Email unique
            password_hash: Hash du mot de passe (déjà hashé)
            role: Rôle ('admin' ou 'user')
            preferences: Préférences JSON optionnelles
        
        Returns:
            Dict: Utilisateur créé au format dict
        
        Raises:
            IntegrityError: Si username ou email existe déjà
        """
        with self.get_db_session() as session:
            user = User(
                username=username,
                email=email,
                password_hash=password_hash,
                role=role,
                preferences=preferences or {}
            )
            session.add(user)
            session.flush()
            logger.info(f"✅ Utilisateur créé: {username} ({email})")
            return user.to_dict()
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Récupère un utilisateur par son ID"""
        with self.get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            return user.to_dict() if user else None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Récupère un utilisateur par son email"""
        with self.get_db_session() as session:
            user = session.query(User).filter(User.email == email).first()
            return user.to_dict() if user else None
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Récupère un utilisateur par son username"""
        with self.get_db_session() as session:
            user = session.query(User).filter(User.username == username).first()
            return user.to_dict() if user else None
    
    def get_user_for_auth(self, username_or_email: str) -> Optional[Dict[str, Any]]:
        """
        Récupère un utilisateur pour authentification (INCLUT password_hash)
        Utilisé UNIQUEMENT pour l'authentification
        
        Args:
            username_or_email: Username ou email de l'utilisateur
            
        Returns:
            Dict incluant password_hash ou None si non trouvé
        """
        with self.get_db_session() as session:
            user = session.query(User).filter(
                (User.username == username_or_email) | (User.email == username_or_email)
            ).first()
            
            if not user:
                return None
            
            # Retourner dict AVEC password_hash pour vérification
            user_dict = user.to_dict()
            user_dict['password_hash'] = user.password_hash
            return user_dict
    
    def get_user_for_auth_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Récupère un utilisateur par ID pour authentification (INCLUT password_hash)
        Utilisé pour update_password
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Dict incluant password_hash ou None si non trouvé
        """
        with self.get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            
            if not user:
                return None
            
            # Retourner dict AVEC password_hash pour vérification
            user_dict = user.to_dict()
            user_dict['password_hash'] = user.password_hash
            return user_dict

    
    def update_user(self, user_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Met à jour un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            **kwargs: Champs à mettre à jour (email, password_hash, role, preferences)
        
        Returns:
            Dict: Utilisateur mis à jour ou None si non trouvé
        """
        with self.get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            
            user.updated_at = datetime.utcnow()
            session.flush()
            logger.info(f"✅ Utilisateur {user_id} mis à jour")
            return user.to_dict()
    
    def delete_user(self, user_id: int) -> bool:
        """
        Supprime un utilisateur (cascade delete sur workspaces, templates, signatures)
        
        Returns:
            bool: True si supprimé, False si non trouvé
        """
        with self.get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            session.delete(user)
            session.flush()
            logger.info(f"✅ Utilisateur {user_id} supprimé (cascade)")
            return True
    
    def list_users(self, role: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Liste tous les utilisateurs (optionnellement filtrés par rôle)
        
        Args:
            role: Filtre par rôle ('admin' ou 'user'), None = tous
        
        Returns:
            List[Dict]: Liste des utilisateurs
        """
        with self.get_db_session() as session:
            query = session.query(User)
            if role:
                query = query.filter(User.role == role)
            users = query.order_by(User.created_at.desc()).all()
            return [u.to_dict() for u in users]
    
    # ========================================
    # WORKSPACE OPERATIONS
    # ========================================
    
    def create_workspace(self, user_id: int, title: str, 
                        status: "WorkspaceStatus" = None,
                        priority: "WorkspacePriority" = None,
                        source: str = "manual",
                        workspace_metadata: Optional[Dict] = None,
                        tags: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Crée un nouveau workspace
        
        Args:
            user_id: ID de l'utilisateur propriétaire
            title: Titre du workspace
            status: Statut initial (IN_PROGRESS par défaut)
            priority: Priorité (MEDIUM par défaut)
            source: Source de création ('email', 'manual', 'api')
            workspace_metadata: Métadonnées JSON optionnelles
            tags: Liste de tags optionnelle
        
        Returns:
            Dict: Workspace créé (dict)
        """
        with self.get_db_session() as session:
            # Toujours convertir en string value pour SQLAlchemy/PostgreSQL ENUM
            if isinstance(status, WorkspaceStatus):
                status_value = status.value
            elif status is None:
                status_value = WorkspaceStatus.IN_PROGRESS.value
            else:
                status_value = status
            
            if isinstance(priority, WorkspacePriority):
                priority_value = priority.value
            elif priority is None:
                priority_value = WorkspacePriority.MEDIUM.value
            else:
                priority_value = priority
                
            workspace = Workspace(
                user_id=user_id,
                title=title,
                status=status_value,  # Passer la string value
                priority=priority_value,  # Passer la string value
                source=source,
                workspace_metadata=workspace_metadata or {},
                tags=tags or []
            )
            session.add(workspace)
            session.flush()
            logger.info(f"✅ Workspace créé: '{title}' (user_id={user_id})")
            return workspace.to_dict()
    
    def get_workspace_by_id(self, workspace_id: int) -> Optional[Dict[str, Any]]:
        """Récupère un workspace par son ID"""
        with self.get_db_session() as session:
            workspace = session.query(Workspace).filter(Workspace.id == workspace_id).first()
            return workspace.to_dict() if workspace else None
    
    def update_workspace(self, workspace_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Met à jour un workspace
        
        Args:
            workspace_id: ID du workspace
            **kwargs: Champs à mettre à jour (title, status, priority, progress, etc.)
        
        Returns:
            Dict: Workspace mis à jour ou None si non trouvé
        """
        with self.get_db_session() as session:
            workspace = session.query(Workspace).filter(Workspace.id == workspace_id).first()
            if not workspace:
                return None
            
            for key, value in kwargs.items():
                if hasattr(workspace, key):
                    # Convertir enum en valeur string pour PostgreSQL
                    if isinstance(value, (WorkspaceStatus, WorkspacePriority)):
                        value = value.value
                    setattr(workspace, key, value)
            
            workspace.updated_at = datetime.utcnow()
            session.flush()
            logger.info(f"✅ Workspace {workspace_id} mis à jour")
            return workspace.to_dict()
    
    def delete_workspace(self, workspace_id: int) -> bool:
        """
        Supprime un workspace (cascade delete sur messages)
        
        Returns:
            bool: True si supprimé, False si non trouvé
        """
        with self.get_db_session() as session:
            workspace = session.query(Workspace).filter(Workspace.id == workspace_id).first()
            if not workspace:
                return False
            
            session.delete(workspace)
            session.flush()
            logger.info(f"✅ Workspace {workspace_id} supprimé (cascade)")
            return True
    
    def list_workspaces(self, user_id: int, 
                       status: Optional[WorkspaceStatus] = None,
                       priority: Optional[WorkspacePriority] = None,
                       source: Optional[str] = None,
                       limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Liste les workspaces d'un utilisateur avec filtres optionnels
        
        Args:
            user_id: ID de l'utilisateur
            status: Filtre par statut (PENDING, IN_PROGRESS, COMPLETED, ARCHIVED)
            priority: Filtre par priorité (LOW, MEDIUM, HIGH, URGENT)
            source: Filtre par source ('email', 'manual', 'api')
            limit: Nombre max de résultats
        
        Returns:
            List[Dict]: Liste des workspaces triés par date (plus récents d'abord)
        """
        with self.get_db_session() as session:
            query = session.query(Workspace).filter(Workspace.user_id == user_id)
            
            if status:
                # Convertir enum en string pour comparaison PostgreSQL
                status_value = status.value if isinstance(status, WorkspaceStatus) else status
                query = query.filter(Workspace.status == status_value)
            if priority:
                # Convertir enum en string pour comparaison PostgreSQL
                priority_value = priority.value if isinstance(priority, WorkspacePriority) else priority
                query = query.filter(Workspace.priority == priority_value)
            if source:
                query = query.filter(Workspace.source == source)
            
            query = query.order_by(desc(Workspace.created_at))
            
            if limit:
                query = query.limit(limit)
            
            workspaces = query.all()
            return [w.to_dict() for w in workspaces]
    
    def search_workspaces(self, user_id: int, search_term: str) -> List[Dict[str, Any]]:
        """
        Recherche des workspaces par titre (case-insensitive)
        
        Args:
            user_id: ID de l'utilisateur
            search_term: Terme de recherche
        
        Returns:
            List[Dict]: Workspaces correspondants
        """
        with self.get_db_session() as session:
            workspaces = session.query(Workspace).filter(
                and_(
                    Workspace.user_id == user_id,
                    Workspace.title.ilike(f"%{search_term}%")
                )
            ).order_by(desc(Workspace.created_at)).all()
            return [w.to_dict() for w in workspaces]
    
    # ========================================
    # MESSAGE OPERATIONS
    # ========================================
    
    def create_message(self, workspace_id: int, role: MessageRole,
                      content: str, message_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Crée un nouveau message dans un workspace
        
        Args:
            workspace_id: ID du workspace
            role: Rôle du message (USER, ASSISTANT, SYSTEM)
            content: Contenu du message
            message_metadata: Métadonnées JSON optionnelles
        
        Returns:
            Dict: Message créé (dict)
        """
        with self.get_db_session() as session:
            # Convertir enum en string
            role_value = role.value if isinstance(role, MessageRole) else role
            
            message = Message(
                workspace_id=workspace_id,
                role=role_value,
                content=content,
                message_metadata=message_metadata or {}
            )
            session.add(message)
            session.flush()
            logger.info(f"✅ Message créé dans workspace {workspace_id} (role={role_value})")
            return message.to_dict()
    
    def get_message_by_id(self, message_id: int) -> Optional[Message]:
        """Récupère un message par son ID"""
        with self.get_db_session() as session:
            return session.query(Message).filter(Message.id == message_id).first()
    
    def list_messages_by_workspace(self, workspace_id: int, 
                                  role: Optional[MessageRole] = None) -> List[Dict[str, Any]]:
        """
        Liste tous les messages d'un workspace
        
        Args:
            workspace_id: ID du workspace
            role: Filtre optionnel par rôle (USER, ASSISTANT, SYSTEM)
        
        Returns:
            List[Dict]: Messages triés par date de création (plus anciens d'abord)
        """
        with self.get_db_session() as session:
            query = session.query(Message).filter(Message.workspace_id == workspace_id)
            
            if role:
                # Convertir enum en string
                role_value = role.value if isinstance(role, MessageRole) else role
                query = query.filter(Message.role == role_value)
            
            messages = query.order_by(Message.created_at).all()
            return [m.to_dict() for m in messages]
    
    def delete_message(self, message_id: int) -> bool:
        """
        Supprime un message
        
        Returns:
            bool: True si supprimé, False si non trouvé
        """
        with self.get_db_session() as session:
            message = session.query(Message).filter(Message.id == message_id).first()
            if not message:
                return False
            
            session.delete(message)
            session.flush()
            logger.info(f"✅ Message {message_id} supprimé")
            return True
    
    # ========================================
    # TEMPLATE OPERATIONS
    # ========================================
    
    def create_template(self, user_id: int, name: str, category: str,
                       subject: str, body: str, 
                       variables: Optional[List[str]] = None) -> Template:
        """
        Crée un nouveau template
        
        Args:
            user_id: ID de l'utilisateur propriétaire
            name: Nom du template
            category: Catégorie (courrier, email, officiel, etc.)
            subject: Sujet du template
            body: Corps du template (peut contenir variables {var})
            variables: Liste des variables utilisées dans le template
        
        Returns:
            Template: Template créé
        """
        with self.get_db_session() as session:
            template = Template(
                user_id=user_id,
                name=name,
                category=category,
                subject=subject,
                body=body,
                variables=variables or []
            )
            session.add(template)
            session.flush()
            logger.info(f"✅ Template créé: '{name}' (category={category})")
            return template
    
    def get_template_by_id(self, template_id: int) -> Optional[Template]:
        """Récupère un template par son ID"""
        with self.get_db_session() as session:
            return session.query(Template).filter(Template.id == template_id).first()
    
    def update_template(self, template_id: int, **kwargs) -> Optional[Template]:
        """
        Met à jour un template
        
        Args:
            template_id: ID du template
            **kwargs: Champs à mettre à jour
        
        Returns:
            Template: Template mis à jour ou None si non trouvé
        """
        with self.get_db_session() as session:
            template = session.query(Template).filter(Template.id == template_id).first()
            if not template:
                return None
            
            for key, value in kwargs.items():
                if hasattr(template, key):
                    setattr(template, key, value)
            
            template.updated_at = datetime.utcnow()
            session.flush()
            logger.info(f"✅ Template {template_id} mis à jour")
            return template
    
    def delete_template(self, template_id: int) -> bool:
        """Supprime un template"""
        with self.get_db_session() as session:
            template = session.query(Template).filter(Template.id == template_id).first()
            if not template:
                return False
            
            session.delete(template)
            session.flush()
            logger.info(f"✅ Template {template_id} supprimé")
            return True
    
    def list_templates(self, user_id: int, category: Optional[str] = None) -> List[Template]:
        """
        Liste les templates d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            category: Filtre optionnel par catégorie
        
        Returns:
            List[Template]: Templates triés par usage puis par nom
        """
        with self.get_db_session() as session:
            query = session.query(Template).filter(Template.user_id == user_id)
            
            if category:
                query = query.filter(Template.category == category)
            
            return query.order_by(desc(Template.usage_count), Template.name).all()
    
    def increment_template_usage(self, template_id: int) -> bool:
        """Incrémente le compteur d'utilisation d'un template"""
        with self.get_db_session() as session:
            template = session.query(Template).filter(Template.id == template_id).first()
            if not template:
                return False
            
            template.usage_count += 1
            session.flush()
            return True
    
    # ========================================
    # SIGNATURE OPERATIONS
    # ========================================
    
    def create_signature(self, user_id: int, name: str, content: str,
                        is_default: bool = False) -> Signature:
        """
        Crée une nouvelle signature
        
        Args:
            user_id: ID de l'utilisateur propriétaire
            name: Nom de la signature
            content: Contenu de la signature (texte ou HTML)
            is_default: Si True, devient la signature par défaut
        
        Returns:
            Signature: Signature créée
        """
        with self.get_db_session() as session:
            # Si is_default=True, désactiver les autres signatures par défaut
            if is_default:
                session.query(Signature).filter(
                    and_(
                        Signature.user_id == user_id,
                        Signature.is_default == True
                    )
                ).update({Signature.is_default: False})
            
            signature = Signature(
                user_id=user_id,
                name=name,
                content=content,
                is_default=is_default
            )
            session.add(signature)
            session.flush()
            logger.info(f"✅ Signature créée: '{name}' (default={is_default})")
            return signature
    
    def get_signature_by_id(self, signature_id: int) -> Optional[Signature]:
        """Récupère une signature par son ID"""
        with self.get_db_session() as session:
            return session.query(Signature).filter(Signature.id == signature_id).first()
    
    def get_default_signature(self, user_id: int) -> Optional[Signature]:
        """Récupère la signature par défaut d'un utilisateur"""
        with self.get_db_session() as session:
            return session.query(Signature).filter(
                and_(
                    Signature.user_id == user_id,
                    Signature.is_default == True
                )
            ).first()
    
    def update_signature(self, signature_id: int, **kwargs) -> Optional[Signature]:
        """Met à jour une signature"""
        with self.get_db_session() as session:
            signature = session.query(Signature).filter(Signature.id == signature_id).first()
            if not signature:
                return None
            
            # Si on change is_default à True, désactiver les autres
            if kwargs.get('is_default') is True:
                session.query(Signature).filter(
                    and_(
                        Signature.user_id == signature.user_id,
                        Signature.id != signature_id,
                        Signature.is_default == True
                    )
                ).update({Signature.is_default: False})
            
            for key, value in kwargs.items():
                if hasattr(signature, key):
                    setattr(signature, key, value)
            
            signature.updated_at = datetime.utcnow()
            session.flush()
            logger.info(f"✅ Signature {signature_id} mise à jour")
            return signature
    
    def delete_signature(self, signature_id: int) -> bool:
        """Supprime une signature"""
        with self.get_db_session() as session:
            signature = session.query(Signature).filter(Signature.id == signature_id).first()
            if not signature:
                return False
            
            session.delete(signature)
            session.flush()
            logger.info(f"✅ Signature {signature_id} supprimée")
            return True
    
    def list_signatures(self, user_id: int) -> List[Signature]:
        """Liste toutes les signatures d'un utilisateur (par défaut en premier)"""
        with self.get_db_session() as session:
            return session.query(Signature).filter(
                Signature.user_id == user_id
            ).order_by(desc(Signature.is_default), Signature.name).all()
    
    # ========================================
    # STATISTICS & UTILITIES
    # ========================================
    
    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """
        Récupère les statistiques d'un utilisateur
        
        Returns:
            Dict avec total_workspaces, pending, in_progress, completed, etc.
        """
        with self.get_db_session() as session:
            workspaces = session.query(Workspace).filter(Workspace.user_id == user_id).all()
            
            stats = {
                'total_workspaces': len(workspaces),
                'not_started': sum(1 for w in workspaces if w.status == 'NOT_STARTED'),
                'in_progress': sum(1 for w in workspaces if w.status == 'IN_PROGRESS'),
                'completed': sum(1 for w in workspaces if w.status == 'COMPLETED'),
                'archived': sum(1 for w in workspaces if w.status == 'ARCHIVED'),
                'urgent': sum(1 for w in workspaces if w.priority == 'URGENT'),
                'high': sum(1 for w in workspaces if w.priority == 'HIGH'),
                'medium': sum(1 for w in workspaces if w.priority == 'MEDIUM'),
                'low': sum(1 for w in workspaces if w.priority == 'LOW'),
                'avg_progress': sum(w.progress for w in workspaces) / len(workspaces) if workspaces else 0
            }
            
            return stats
    
    def health_check(self) -> bool:
        """
        Vérifie que la connexion database fonctionne
        
        Returns:
            bool: True si OK, False sinon
        """
        try:
            with self.get_db_session() as session:
                session.execute(text("SELECT 1"))
                return True
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return False


# Instance globale (singleton pattern)
_db_service = None

def get_database_service() -> DatabaseService:
    """
    Récupère l'instance singleton du DatabaseService
    
    Usage:
        from services.database_service import get_database_service
        db = get_database_service()
        user = db.get_user_by_id(1)
    """
    global _db_service
    if _db_service is None:
        _db_service = DatabaseService()
    return _db_service
