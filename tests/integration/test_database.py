"""
Tests d'intégration PostgreSQL
Créé: 28 Décembre 2025
"""

import pytest
import sys
import os
from datetime import datetime

# Ajouter le path backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'backend'))

from models.database import (
    create_engine_and_session,
    User, Workspace, Message, Template, Signature,
    WorkspaceStatus, WorkspacePriority, MessageRole,
    get_database_url
)

# ============================================================
# FIXTURES
# ============================================================

@pytest.fixture(scope='session')
def engine_and_session():
    """Créer engine et session factory pour tous les tests"""
    engine, SessionLocal = create_engine_and_session()
    yield engine, SessionLocal
    engine.dispose()

@pytest.fixture(scope='function')
def session(engine_and_session):
    """Créer une session pour chaque test"""
    engine, SessionLocal = engine_and_session
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

# ============================================================
# TESTS CONFIGURATION
# ============================================================

class TestDatabaseConfig:
    """Tests de configuration de la base de données"""
    
    def test_database_url_loaded(self):
        """Test que l'URL de la base de données est chargée"""
        db_url = get_database_url()
        assert db_url is not None
        assert 'postgresql' in db_url
    
    def test_engine_creation(self, engine_and_session):
        """Test que l'engine SQLAlchemy est créé"""
        engine, SessionLocal = engine_and_session
        assert engine is not None
        assert SessionLocal is not None
    
    def test_database_connection(self, session):
        """Test la connexion à la base de données"""
        # Simple query pour tester la connexion
        result = session.execute("SELECT 1")
        assert result is not None

# ============================================================
# TESTS USER
# ============================================================

class TestUserModel:
    """Tests du modèle User"""
    
    def test_create_user(self, session):
        """Test création d'un utilisateur"""
        user = User(
            username='testuser',
            email='test@example.com',
            password_hash='hashed_password',
            first_name='Test',
            last_name='User',
            role='user'
        )
        
        session.add(user)
        session.commit()
        
        assert user.id is not None
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.is_active is True
    
    def test_user_unique_email(self, session):
        """Test que l'email est unique"""
        user1 = User(
            username='user1',
            email='duplicate@example.com',
            password_hash='hash1'
        )
        session.add(user1)
        session.commit()
        
        user2 = User(
            username='user2',
            email='duplicate@example.com',
            password_hash='hash2'
        )
        session.add(user2)
        
        with pytest.raises(Exception):
            session.commit()
    
    def test_user_to_dict(self, session):
        """Test conversion User en dictionnaire"""
        user = User(
            username='dictuser',
            email='dict@example.com',
            password_hash='hash',
            role='admin'
        )
        session.add(user)
        session.commit()
        
        user_dict = user.to_dict()
        assert isinstance(user_dict, dict)
        assert user_dict['username'] == 'dictuser'
        assert user_dict['email'] == 'dict@example.com'
        assert user_dict['role'] == 'admin'
        assert 'password_hash' not in user_dict

# ============================================================
# TESTS WORKSPACE
# ============================================================

class TestWorkspaceModel:
    """Tests du modèle Workspace"""
    
    def test_create_workspace(self, session):
        """Test création d'un workspace"""
        # Créer user d'abord
        user = User(
            username='wsuser',
            email='ws@example.com',
            password_hash='hash'
        )
        session.add(user)
        session.commit()
        
        # Créer workspace
        workspace = Workspace(
            user_id=user.id,
            title='Test Workspace',
            description='Test description',
            status=WorkspaceStatus.IN_PROGRESS,
            priority=WorkspacePriority.HIGH,
            source='email',
            tags=['test', 'demo']
        )
        session.add(workspace)
        session.commit()
        
        assert workspace.id is not None
        assert workspace.title == 'Test Workspace'
        assert workspace.status == WorkspaceStatus.IN_PROGRESS
        assert workspace.priority == WorkspacePriority.HIGH
        assert workspace.progress == 0.0
    
    def test_workspace_user_relationship(self, session):
        """Test relation Workspace -> User"""
        user = User(
            username='reluser',
            email='rel@example.com',
            password_hash='hash'
        )
        session.add(user)
        session.commit()
        
        workspace = Workspace(
            user_id=user.id,
            title='Relation Test',
            status=WorkspaceStatus.NOT_STARTED,
            priority=WorkspacePriority.MEDIUM
        )
        session.add(workspace)
        session.commit()
        
        # Recharger pour tester la relation
        session.refresh(workspace)
        assert workspace.owner is not None
        assert workspace.owner.email == 'rel@example.com'
    
    def test_workspace_to_dict(self, session):
        """Test conversion Workspace en dictionnaire"""
        user = User(username='u', email='u@e.com', password_hash='h')
        session.add(user)
        session.commit()
        
        workspace = Workspace(
            user_id=user.id,
            title='Dict Test',
            status=WorkspaceStatus.COMPLETED,
            priority=WorkspacePriority.URGENT,
            progress=100.0,
            workspace_metadata={'key': 'value'},
            tags=['tag1', 'tag2']
        )
        session.add(workspace)
        session.commit()
        
        ws_dict = workspace.to_dict()
        assert isinstance(ws_dict, dict)
        assert ws_dict['title'] == 'Dict Test'
        assert ws_dict['status'] == 'completed'
        assert ws_dict['priority'] == 'urgent'
        assert ws_dict['progress'] == 100.0
        assert ws_dict['workspace_metadata'] == {'key': 'value'}
        assert ws_dict['tags'] == ['tag1', 'tag2']

# ============================================================
# TESTS MESSAGE
# ============================================================

class TestMessageModel:
    """Tests du modèle Message"""
    
    def test_create_message(self, session):
        """Test création d'un message"""
        # Setup user et workspace
        user = User(username='msguser', email='msg@e.com', password_hash='h')
        session.add(user)
        session.commit()
        
        workspace = Workspace(
            user_id=user.id,
            title='WS',
            status=WorkspaceStatus.IN_PROGRESS,
            priority=WorkspacePriority.MEDIUM
        )
        session.add(workspace)
        session.commit()
        
        # Créer message
        message = Message(
            workspace_id=workspace.id,
            role=MessageRole.USER,
            content='Hello world',
            message_metadata={'tokens': 10}
        )
        session.add(message)
        session.commit()
        
        assert message.id is not None
        assert message.workspace_id == workspace.id
        assert message.role == MessageRole.USER
        assert message.content == 'Hello world'
        assert message.message_metadata == {'tokens': 10}
    
    def test_message_workspace_relationship(self, session):
        """Test relation Message -> Workspace"""
        user = User(username='u', email='u@e.com', password_hash='h')
        workspace = Workspace(
            user_id=1,  # Assume admin exists
            title='WS',
            status=WorkspaceStatus.IN_PROGRESS,
            priority=WorkspacePriority.MEDIUM
        )
        session.add(workspace)
        session.commit()
        
        message = Message(
            workspace_id=workspace.id,
            role=MessageRole.ASSISTANT,
            content='Response'
        )
        session.add(message)
        session.commit()
        
        session.refresh(message)
        assert message.workspace is not None
        assert message.workspace.title == 'WS'

# ============================================================
# TESTS TEMPLATE
# ============================================================

class TestTemplateModel:
    """Tests du modèle Template"""
    
    def test_create_template(self, session):
        """Test création d'un template"""
        template = Template(
            user_id=1,  # Assume admin exists
            name='Test Template',
            category='commercial',
            subject='Test Subject',
            body='Template body',
            is_html=False,
            variables=['name', 'date']
        )
        session.add(template)
        session.commit()
        
        assert template.id is not None
        assert template.name == 'Test Template'
        assert template.category == 'commercial'
        assert template.is_active is True
        assert template.usage_count == 0
    
    def test_template_to_dict(self, session):
        """Test conversion Template en dictionnaire"""
        template = Template(
            user_id=1,
            name='Dict Template',
            body='Body',
            variables=['var1', 'var2']
        )
        session.add(template)
        session.commit()
        
        tpl_dict = template.to_dict()
        assert isinstance(tpl_dict, dict)
        assert tpl_dict['name'] == 'Dict Template'
        assert tpl_dict['variables'] == ['var1', 'var2']

# ============================================================
# TESTS SIGNATURE
# ============================================================

class TestSignatureModel:
    """Tests du modèle Signature"""
    
    def test_create_signature(self, session):
        """Test création d'une signature"""
        signature = Signature(
            user_id=1,  # Assume admin exists
            name='Test Signature',
            content='Best regards,\nJohn Doe',
            is_html=False,
            is_default=True
        )
        session.add(signature)
        session.commit()
        
        assert signature.id is not None
        assert signature.name == 'Test Signature'
        assert signature.is_default is True
        assert signature.is_active is True
    
    def test_signature_to_dict(self, session):
        """Test conversion Signature en dictionnaire"""
        signature = Signature(
            user_id=1,
            name='Dict Sig',
            content='Content',
            is_default=False
        )
        session.add(signature)
        session.commit()
        
        sig_dict = signature.to_dict()
        assert isinstance(sig_dict, dict)
        assert sig_dict['name'] == 'Dict Sig'
        assert sig_dict['is_default'] is False

# ============================================================
# TESTS CRUD OPERATIONS
# ============================================================

class TestCRUDOperations:
    """Tests des opérations CRUD complètes"""
    
    def test_workspace_full_crud(self, session):
        """Test CREATE, READ, UPDATE, DELETE pour Workspace"""
        # CREATE
        workspace = Workspace(
            user_id=1,
            title='CRUD Test',
            status=WorkspaceStatus.NOT_STARTED,
            priority=WorkspacePriority.LOW
        )
        session.add(workspace)
        session.commit()
        ws_id = workspace.id
        
        # READ
        found_ws = session.query(Workspace).filter_by(id=ws_id).first()
        assert found_ws is not None
        assert found_ws.title == 'CRUD Test'
        
        # UPDATE
        found_ws.title = 'Updated Title'
        found_ws.status = WorkspaceStatus.IN_PROGRESS
        found_ws.progress = 50.0
        session.commit()
        
        updated_ws = session.query(Workspace).filter_by(id=ws_id).first()
        assert updated_ws.title == 'Updated Title'
        assert updated_ws.status == WorkspaceStatus.IN_PROGRESS
        assert updated_ws.progress == 50.0
        
        # DELETE
        session.delete(updated_ws)
        session.commit()
        
        deleted_ws = session.query(Workspace).filter_by(id=ws_id).first()
        assert deleted_ws is None
    
    def test_query_workspaces_by_status(self, session):
        """Test query des workspaces par statut"""
        # Créer plusieurs workspaces
        for i, status in enumerate([WorkspaceStatus.NOT_STARTED, WorkspaceStatus.IN_PROGRESS, WorkspaceStatus.COMPLETED]):
            ws = Workspace(
                user_id=1,
                title=f'WS {i}',
                status=status,
                priority=WorkspacePriority.MEDIUM
            )
            session.add(ws)
        session.commit()
        
        # Query par statut
        in_progress = session.query(Workspace).filter_by(status=WorkspaceStatus.IN_PROGRESS).all()
        assert len(in_progress) >= 1
        
        completed = session.query(Workspace).filter_by(status=WorkspaceStatus.COMPLETED).all()
        assert len(completed) >= 1
    
    def test_query_workspaces_by_priority(self, session):
        """Test query des workspaces par priorité"""
        urgent_ws = Workspace(
            user_id=1,
            title='Urgent WS',
            status=WorkspaceStatus.NOT_STARTED,
            priority=WorkspacePriority.URGENT
        )
        session.add(urgent_ws)
        session.commit()
        
        urgent_list = session.query(Workspace).filter_by(priority=WorkspacePriority.URGENT).all()
        assert len(urgent_list) >= 1

# ============================================================
# TESTS CASCADE DELETE
# ============================================================

class TestCascadeDelete:
    """Tests des suppressions en cascade"""
    
    def test_delete_workspace_deletes_messages(self, session):
        """Test que la suppression d'un workspace supprime ses messages"""
        workspace = Workspace(
            user_id=1,
            title='Cascade Test',
            status=WorkspaceStatus.IN_PROGRESS,
            priority=WorkspacePriority.MEDIUM
        )
        session.add(workspace)
        session.commit()
        ws_id = workspace.id
        
        # Ajouter messages
        for i in range(3):
            msg = Message(
                workspace_id=ws_id,
                role=MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT,
                content=f'Message {i}'
            )
            session.add(msg)
        session.commit()
        
        # Vérifier que messages existent
        messages_count = session.query(Message).filter_by(workspace_id=ws_id).count()
        assert messages_count == 3
        
        # Supprimer workspace
        session.delete(workspace)
        session.commit()
        
        # Vérifier que messages sont supprimés
        messages_after = session.query(Message).filter_by(workspace_id=ws_id).count()
        assert messages_after == 0

# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
