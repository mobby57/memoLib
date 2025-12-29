"""
Package models backend
"""

from .database import (
    Base,
    User,
    Workspace,
    Message,
    Template,
    Signature,
    WorkspaceStatus,
    WorkspacePriority,
    MessageRole,
    get_database_url,
    create_engine_and_session,
    init_database,
    get_session
)

# Pour compatibilité avec les imports existants
try:
    from src.backend.models import Contact, Email
except ImportError:
    # Si les modèles n'existent pas, créer des classes dummy
    class Contact:
        pass
    class Email:
        pass

__all__ = [
    'Base',
    'User',
    'Workspace',
    'Message',
    'Template',
    'Signature',
    'WorkspaceStatus',
    'WorkspacePriority',
    'MessageRole',
    'get_database_url',
    'create_engine_and_session',
    'init_database',
    'get_session'
]
