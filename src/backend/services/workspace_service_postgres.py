"""
Workspace Service PostgreSQL - Version simplifiée utilisant database_service
Conserve la logique métier mais utilise PostgreSQL pour la persistance
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.database_service import get_database_service
from src.backend.models.database import WorkspaceStatus, WorkspacePriority, MessageRole

logger = logging.getLogger(__name__)


class WorkspaceServicePostgres:
    """Service de gestion des workspaces avec PostgreSQL"""
    
    def __init__(self):
        self.db = get_database_service()
    
    def create_workspace(
        self,
        user_id: int,
        title: str,
        source: str = "manual",
        email_data: Optional[Dict] = None,
        status: "WorkspaceStatus" = None,
        priority: "WorkspacePriority" = None
    ) -> Dict[str, Any]:
        """
        Crée un nouveau workspace
        
        Args:
            user_id: ID de l'utilisateur
            title: Titre du workspace
            source: Source ('email', 'manual', 'api')
            email_data: Données email si source=email (subject, content, sender)
            status: Statut initial
            priority: Priorité
        
        Returns:
            Dict: Workspace créé au format JSON
        """
        try:
            # Convertir enum en string si nécessaire
            if isinstance(status, WorkspaceStatus):
                status = status.value
            if isinstance(priority, WorkspacePriority):
                priority = priority.value
                
            # Préparer metadata
            metadata = {
                'created_via': source,
                'email_data': email_data if email_data else {}
            }
            
            # Créer workspace dans PostgreSQL
            workspace = self.db.create_workspace(
                user_id=user_id,
                title=title,
                status=status,  # Maintenant string ou None
                priority=priority,  # Maintenant string ou None
                source=source,
                workspace_metadata=metadata
            )
            
            # workspace est déjà un dict maintenant
            logger.info(f"✅ Workspace créé: {workspace['id']} - '{title}'")
            
            return workspace
            
        except Exception as e:
            logger.error(f"❌ Erreur création workspace: {e}")
            raise
    
    def get_workspace(self, workspace_id: int) -> Optional[Dict[str, Any]]:
        """Récupère un workspace par ID"""
        try:
            workspace = self.db.get_workspace_by_id(workspace_id)
            # workspace est déjà un dict maintenant
            return workspace
        except Exception as e:
            logger.error(f"❌ Erreur récupération workspace {workspace_id}: {e}")
            return None
    
    def update_workspace(
        self,
        workspace_id: int,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Met à jour un workspace
        
        Args:
            workspace_id: ID du workspace
            **kwargs: Champs à mettre à jour (title, status, priority, progress, etc.)
        
        Returns:
            Dict: Workspace mis à jour ou None
        """
        try:
            # Convertir enum en string si présent dans kwargs
            if 'status' in kwargs and isinstance(kwargs['status'], WorkspaceStatus):
                kwargs['status'] = kwargs['status'].value
            if 'priority' in kwargs and isinstance(kwargs['priority'], WorkspacePriority):
                kwargs['priority'] = kwargs['priority'].value
                
            workspace = self.db.update_workspace(workspace_id, **kwargs)
            
            if workspace:
                logger.info(f"✅ Workspace {workspace_id} mis à jour")
                # workspace est déjà un dict
                return workspace
            else:
                logger.warning(f"⚠️ Workspace {workspace_id} non trouvé")
                return None
                
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour workspace {workspace_id}: {e}")
            raise
    
    def delete_workspace(self, workspace_id: int) -> bool:
        """Supprime un workspace (cascade sur messages)"""
        try:
            success = self.db.delete_workspace(workspace_id)
            
            if success:
                logger.info(f"✅ Workspace {workspace_id} supprimé")
            else:
                logger.warning(f"⚠️ Workspace {workspace_id} non trouvé")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Erreur suppression workspace {workspace_id}: {e}")
            raise
    
    def list_workspaces(
        self,
        user_id: int,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        source: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Liste les workspaces d'un utilisateur avec filtres
        
        Args:
            user_id: ID utilisateur
            status: Filtre par statut ('pending', 'in_progress', 'completed', 'archived')
            priority: Filtre par priorité ('low', 'medium', 'high', 'urgent')
            source: Filtre par source ('email', 'manual', 'api')
            limit: Nombre max de résultats
        
        Returns:
            List[Dict]: Liste des workspaces
        """
        try:
            # Convertir strings en enums puis en values
            status_value = None
            if status:
                status_enum = WorkspaceStatus[status.upper()]
                status_value = status_enum.value
            
            priority_value = None
            if priority:
                priority_enum = WorkspacePriority[priority.upper()]
                priority_value = priority_enum.value
            
            workspaces = self.db.list_workspaces(
                user_id=user_id,
                status=status_value,
                priority=priority_value,
                source=source,
                limit=limit
            )
            
            # workspaces est déjà une liste de dicts
            return workspaces
            
        except Exception as e:
            logger.error(f"❌ Erreur listage workspaces user {user_id}: {e}")
            raise
    
    def search_workspaces(self, user_id: int, search_term: str) -> List[Dict[str, Any]]:
        """Recherche workspaces par titre"""
        try:
            workspaces = self.db.search_workspaces(user_id, search_term)
            # workspaces est déjà une liste de dicts
            return workspaces
        except Exception as e:
            logger.error(f"❌ Erreur recherche workspaces: {e}")
            raise
    
    # ========================================
    # MESSAGES MANAGEMENT
    # ========================================
    
    def add_message(
        self,
        workspace_id: int,
        role: str,
        content: str,
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Ajoute un message à un workspace
        
        Args:
            workspace_id: ID du workspace
            role: Rôle ('user', 'assistant', 'system')
            content: Contenu du message
            metadata: Métadonnées optionnelles
        
        Returns:
            Dict: Message créé
        """
        try:
            # Convertir string en enum puis en value
            role_enum = MessageRole[role.upper()]
            
            message = self.db.create_message(
                workspace_id=workspace_id,
                role=role_enum,  # database_service convertira en string
                content=content,
                message_metadata=metadata or {}
            )
            
            logger.info(f"✅ Message ajouté au workspace {workspace_id}")
            
            return message  # Déjà un dict
            
        except Exception as e:
            logger.error(f"❌ Erreur ajout message workspace {workspace_id}: {e}")
            raise
    
    def get_workspace_messages(
        self,
        workspace_id: int,
        role: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Récupère tous les messages d'un workspace
        
        Args:
            workspace_id: ID du workspace
            role: Filtre optionnel par rôle ('user', 'assistant', 'system')
        
        Returns:
            List[Dict]: Messages triés par date
        """
        try:
            role_enum = MessageRole[role.upper()] if role else None
            
            messages = self.db.list_messages_by_workspace(
                workspace_id=workspace_id,
                role=role_enum
            )
            
            return messages  # Déjà des dicts
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération messages workspace {workspace_id}: {e}")
            raise
    
    # ========================================
    # STATISTICS & UTILITIES
    # ========================================
    
    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """Récupère les statistiques d'un utilisateur"""
        try:
            return self.db.get_user_stats(user_id)
        except Exception as e:
            logger.error(f"❌ Erreur stats user {user_id}: {e}")
            raise
    
    def get_workspace_with_messages(self, workspace_id: int) -> Optional[Dict[str, Any]]:
        """
        Récupère un workspace avec tous ses messages
        
        Returns:
            Dict: Workspace avec clé 'messages' contenant la liste des messages
        """
        try:
            workspace = self.get_workspace(workspace_id)
            if not workspace:
                return None
            
            messages = self.get_workspace_messages(workspace_id)
            workspace['messages'] = messages
            
            return workspace
            
        except Exception as e:
            logger.error(f"❌ Erreur récupération workspace complet {workspace_id}: {e}")
            raise
    
    def update_workspace_progress(
        self,
        workspace_id: int,
        progress: int,
        status: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Met à jour la progression d'un workspace
        
        Args:
            workspace_id: ID du workspace
            progress: Progression 0-100
            status: Statut optionnel à mettre à jour
        
        Returns:
            Dict: Workspace mis à jour
        """
        try:
            kwargs = {'progress': max(0, min(100, progress))}
            
            if status:
                kwargs['status'] = WorkspaceStatus[status.upper()]
            
            # Auto-compléter si progress = 100
            if progress >= 100 and not status:
                kwargs['status'] = WorkspaceStatus.COMPLETED
            
            return self.update_workspace(workspace_id, **kwargs)
            
        except Exception as e:
            logger.error(f"❌ Erreur mise à jour progression {workspace_id}: {e}")
            raise
    
    def archive_workspace(self, workspace_id: int) -> Optional[Dict[str, Any]]:
        """Archive un workspace"""
        try:
            return self.update_workspace(
                workspace_id,
                status=WorkspaceStatus.ARCHIVED
            )
        except Exception as e:
            logger.error(f"❌ Erreur archivage workspace {workspace_id}: {e}")
            raise
    
    def complete_workspace(self, workspace_id: int) -> Optional[Dict[str, Any]]:
        """Marque un workspace comme complété"""
        try:
            return self.update_workspace(
                workspace_id,
                status=WorkspaceStatus.COMPLETED,
                progress=100
            )
        except Exception as e:
            logger.error(f"❌ Erreur completion workspace {workspace_id}: {e}")
            raise


# Instance globale (singleton)
_workspace_service = None

def get_workspace_service() -> WorkspaceServicePostgres:
    """
    Récupère l'instance singleton du WorkspaceServicePostgres
    
    Usage:
        from services.workspace_service_postgres import get_workspace_service
        ws = get_workspace_service()
        workspace = ws.create_workspace(user_id=1, title="Mon courrier")
    """
    global _workspace_service
    if _workspace_service is None:
        _workspace_service = WorkspaceServicePostgres()
    return _workspace_service
