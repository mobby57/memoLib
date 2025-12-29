"""
Modèles SQLAlchemy pour PostgreSQL
Créé: 28 Décembre 2025
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean, 
    DateTime, ForeignKey, JSON, Float, Enum as SQLEnum
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import enum
import os
from dotenv import load_dotenv

load_dotenv()

# Base déclarative
Base = declarative_base()

# Enums
class WorkspaceStatus(enum.Enum):
    """Statuts possibles pour un workspace"""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class WorkspacePriority(enum.Enum):
    """Priorités possibles pour un workspace"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class MessageRole(enum.Enum):
    """Rôles dans les conversations"""
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"

# ============================================================
# MODÈLE USER
# ============================================================

class User(Base):
    """Utilisateur de l'application"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profil
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(String(50), default='user')  # user, admin, manager
    
    # Préférences
    preferences = Column(JSON, default={})
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime)
    is_active = Column(Boolean, default=True)
    
    # Relations
    workspaces = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="owner", cascade="all, delete-orphan")
    signatures = relationship("Signature", back_populates="owner", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
    
    def to_dict(self):
        """Convertir en dictionnaire"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'preferences': self.preferences,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active
        }

# ============================================================
# MODÈLE WORKSPACE
# ============================================================

class Workspace(Base):
    """Workspace de travail (projet)"""
    __tablename__ = 'workspaces'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Propriétaire
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # Informations principales
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Statut et priorité
    status = Column(String(50), default='NOT_STARTED', nullable=False, index=True)
    priority = Column(String(50), default='MEDIUM', nullable=False, index=True)
    
    # Progression
    progress = Column(Float, default=0.0)  # 0.0 à 100.0
    
    # Source
    source = Column(String(50), index=True)  # email, sms, voice, web
    source_id = Column(String(255))  # ID du message source
    
    # Données structurées
    workspace_metadata = Column(JSON, default={})
    tags = Column(JSON, default=[])  # Liste de tags
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)
    due_date = Column(DateTime)
    
    # Relations
    owner = relationship("User", back_populates="workspaces")
    messages = relationship("Message", back_populates="workspace", cascade="all, delete-orphan", order_by="Message.created_at")
    
    def __repr__(self):
        status_val = self.status if isinstance(self.status, str) else self.status.value
        return f"<Workspace(id={self.id}, title='{self.title}', status='{status_val}')>"
    
    def to_dict(self, include_messages=False):
        """Convertir en dictionnaire"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'status': self.status if isinstance(self.status, str) else self.status.value,
            'priority': self.priority if isinstance(self.priority, str) else self.priority.value,
            'progress': self.progress,
            'source': self.source,
            'source_id': self.source_id,
            'workspace_metadata': self.workspace_metadata,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'due_date': self.due_date.isoformat() if self.due_date else None
        }
        
        if include_messages:
            data['messages'] = [msg.to_dict() for msg in self.messages]
        
        return data

# ============================================================
# MODÈLE MESSAGE
# ============================================================

class Message(Base):
    """Message dans une conversation workspace"""
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Workspace parent
    workspace_id = Column(Integer, ForeignKey('workspaces.id'), nullable=False, index=True)
    
    # Contenu
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    
    # Métadonnées
    message_metadata = Column(JSON, default={})  # tokens, model, etc.
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relations
    workspace = relationship("Workspace", back_populates="messages")
    
    def __repr__(self):
        role_val = self.role if isinstance(self.role, str) else self.role.value
        return f"<Message(id={self.id}, workspace_id={self.workspace_id}, role='{role_val}')>"
    
    def to_dict(self):
        """Convertir en dictionnaire"""
        return {
            'id': self.id,
            'workspace_id': self.workspace_id,
            'role': self.role if isinstance(self.role, str) else self.role.value,
            'content': self.content,
            'message_metadata': self.message_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ============================================================
# MODÈLE TEMPLATE
# ============================================================

class Template(Base):
    """Template de courrier/email"""
    __tablename__ = 'templates'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Propriétaire
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # Informations
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    category = Column(String(100), index=True)  # commercial, administratif, etc.
    
    # Contenu
    subject = Column(String(500))  # Pour emails
    body = Column(Text, nullable=False)
    is_html = Column(Boolean, default=False)
    
    # Variables disponibles
    variables = Column(JSON, default=[])  # Liste de variables disponibles
    
    # Métadonnées
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    owner = relationship("User", back_populates="templates")
    
    def __repr__(self):
        return f"<Template(id={self.id}, name='{self.name}', category='{self.category}')>"
    
    def to_dict(self):
        """Convertir en dictionnaire"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'subject': self.subject,
            'body': self.body,
            'is_html': self.is_html,
            'variables': self.variables,
            'is_active': self.is_active,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# ============================================================
# MODÈLE SIGNATURE
# ============================================================

class Signature(Base):
    """Signature email/courrier"""
    __tablename__ = 'signatures'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Propriétaire
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # Informations
    name = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_html = Column(Boolean, default=False)
    
    # Métadonnées
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Dates
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    owner = relationship("User", back_populates="signatures")
    
    def __repr__(self):
        return f"<Signature(id={self.id}, name='{self.name}', is_default={self.is_default})>"
    
    def to_dict(self):
        """Convertir en dictionnaire"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'content': self.content,
            'is_html': self.is_html,
            'is_default': self.is_default,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# ============================================================
# CONFIGURATION DATABASE
# ============================================================

def get_database_url():
    """Récupérer l'URL de la base de données depuis .env"""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        # URL par défaut pour développement local
        database_url = 'postgresql://postgres:postgres@localhost:5432/iapostemanager'
    
    return database_url

def create_engine_and_session():
    """Créer engine SQLAlchemy et session factory"""
    database_url = get_database_url()
    
    # Créer engine
    engine = create_engine(
        database_url,
        echo=False,  # True pour voir les requêtes SQL
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True  # Vérifier connexions avant utilisation
    )
    
    # Créer session factory
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    return engine, SessionLocal

def init_database():
    """Initialiser la base de données (créer toutes les tables)"""
    engine, _ = create_engine_and_session()
    Base.metadata.create_all(bind=engine)
    print("✅ Base de données initialisée")

def get_session():
    """Obtenir une session de base de données (générateur pour dependency injection)"""
    _, SessionLocal = create_engine_and_session()
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

# ============================================================
# EXPORTS
# ============================================================

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

# ============================================================
# TEST STANDALONE
# ============================================================

if __name__ == '__main__':
    print("=" * 60)
    print("🧪 TEST MODÈLES SQLALCHEMY")
    print("=" * 60)
    
    # Afficher URL database
    db_url = get_database_url()
    print(f"\n📊 Database URL: {db_url}")
    
    # Créer engine
    try:
        engine, SessionLocal = create_engine_and_session()
        print("✅ Engine créé")
        
        # Créer tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables créées")
        
        # Lister tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n📋 Tables ({len(tables)}):")
        for table in tables:
            print(f"   - {table}")
        
        # Test création user
        session = SessionLocal()
        try:
            # Créer user de test
            test_user = User(
                username='testuser',
                email='test@example.com',
                password_hash='hashed_password_here',
                first_name='Test',
                last_name='User'
            )
            session.add(test_user)
            session.commit()
            print(f"\n✅ User créé: {test_user}")
            
            # Créer workspace de test
            test_workspace = Workspace(
                user_id=test_user.id,
                title='Workspace de test',
                description='Test description',
                status=WorkspaceStatus.IN_PROGRESS,
                priority=WorkspacePriority.HIGH,
                source='email',
                tags=['test', 'demo']
            )
            session.add(test_workspace)
            session.commit()
            print(f"✅ Workspace créé: {test_workspace}")
            
            # Créer message de test
            test_message = Message(
                workspace_id=test_workspace.id,
                role=MessageRole.USER,
                content='Message de test'
            )
            session.add(test_message)
            session.commit()
            print(f"✅ Message créé: {test_message}")
            
            # Query test
            users = session.query(User).all()
            print(f"\n📊 Users dans DB: {len(users)}")
            
            workspaces = session.query(Workspace).all()
            print(f"📊 Workspaces dans DB: {len(workspaces)}")
            
            # Cleanup
            session.delete(test_message)
            session.delete(test_workspace)
            session.delete(test_user)
            session.commit()
            print("\n🧹 Cleanup effectué")
            
        finally:
            session.close()
        
        print("\n" + "=" * 60)
        print("✅ Tests réussis")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
