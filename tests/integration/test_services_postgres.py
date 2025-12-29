"""
Tests des services PostgreSQL
Test database_service, workspace_service_postgres, user_service_postgres
"""
import pytest
from datetime import datetime

# Import services
from src.backend.services.database_service import get_database_service
from src.backend.services.workspace_service_postgres import get_workspace_service
from src.backend.services.user_service_postgres import get_user_service
from src.backend.models.database import WorkspaceStatus, WorkspacePriority


class TestUserServicePostgres:
    """Tests du service utilisateur PostgreSQL"""
    
    def test_register_user(self):
        """Test création utilisateur"""
        us = get_user_service()
        
        # Créer utilisateur unique
        username = f"testuser_{datetime.now().timestamp()}"
        email = f"test_{datetime.now().timestamp()}@example.com"
        
        user = us.register_user(
            username=username,
            email=email,
            password="testpassword123",
            role="user"
        )
        
        assert user is not None
        assert user['username'] == username
        assert user['email'] == email
        assert user['role'] == "user"  # User.role est string libre, pas enum
        assert 'token' in user
        assert 'password_hash' not in user  # Ne doit jamais être renvoyé
        
        print(f"✅ User créé: {user['id']} - {username}")
    
    def test_authenticate_user(self):
        """Test authentification"""
        us = get_user_service()
        
        # Créer utilisateur
        username = f"authuser_{datetime.now().timestamp()}"
        email = f"auth_{datetime.now().timestamp()}@example.com"
        password = "authpass123"
        
        us.register_user(username, email, password)
        
        # Test auth avec username
        user = us.authenticate_user(username, password)
        assert user is not None
        assert user['username'] == username
        assert 'token' in user
        
        # Test auth avec email
        user2 = us.authenticate_user(email, password)
        assert user2 is not None
        assert user2['email'] == email
        
        # Test mauvais password
        user3 = us.authenticate_user(username, "wrongpassword")
        assert user3 is None
        
        print("✅ Authentification OK")
    
    def test_verify_token(self):
        """Test vérification JWT token"""
        us = get_user_service()
        
        # Créer utilisateur
        username = f"tokenuser_{datetime.now().timestamp()}"
        email = f"token_{datetime.now().timestamp()}@example.com"
        user = us.register_user(username, email, "password123")
        
        token = user['token']
        
        # Vérifier token
        verified_user = us.verify_token(token)
        assert verified_user is not None
        assert verified_user['id'] == user['id']
        assert verified_user['username'] == username
        
        # Test token invalide
        verified_invalid = us.verify_token("invalid.token.here")
        assert verified_invalid is None
        
        print("✅ Token verification OK")
    
    def test_update_password(self):
        """Test changement de password"""
        us = get_user_service()
        
        # Créer utilisateur
        username = f"pwduser_{datetime.now().timestamp()}"
        email = f"pwd_{datetime.now().timestamp()}@example.com"
        old_pwd = "oldpassword123"
        new_pwd = "newpassword456"
        
        user = us.register_user(username, email, old_pwd)
        user_id = user['id']
        
        # Changer password
        success = us.update_password(user_id, old_pwd, new_pwd)
        assert success is True
        
        # Vérifier qu'on peut s'authentifier avec nouveau password
        user_auth = us.authenticate_user(username, new_pwd)
        assert user_auth is not None
        
        # Vérifier qu'ancien password ne fonctionne plus
        user_old = us.authenticate_user(username, old_pwd)
        assert user_old is None
        
        print("✅ Password update OK")


class TestWorkspaceServicePostgres:
    """Tests du service workspace PostgreSQL"""
    
    @pytest.fixture
    def test_user(self):
        """Fixture: créer un utilisateur de test"""
        us = get_user_service()
        username = f"wsuser_{datetime.now().timestamp()}"
        email = f"ws_{datetime.now().timestamp()}@example.com"
        user = us.register_user(username, email, "password123")
        return user
    
    def test_create_workspace(self, test_user):
        """Test création workspace"""
        ws = get_workspace_service()
        
        workspace = ws.create_workspace(
            user_id=test_user['id'],
            title="Test Workspace",
            source="manual",
            status=WorkspaceStatus.IN_PROGRESS,
            priority=WorkspacePriority.MEDIUM
        )
        
        assert workspace is not None
        assert workspace['title'] == "Test Workspace"
        assert workspace['source'] == "manual"
        assert workspace['user_id'] == test_user['id']
        
        print(f"✅ Workspace créé: {workspace['id']}")
    
    def test_get_workspace(self, test_user):
        """Test récupération workspace"""
        ws = get_workspace_service()
        
        # Créer workspace
        created = ws.create_workspace(
            user_id=test_user['id'],
            title="Workspace to Get"
        )
        
        # Récupérer
        fetched = ws.get_workspace(created['id'])
        
        assert fetched is not None
        assert fetched['id'] == created['id']
        assert fetched['title'] == "Workspace to Get"
        
        print("✅ Workspace récupéré OK")
    
    def test_update_workspace(self, test_user):
        """Test mise à jour workspace"""
        ws = get_workspace_service()
        
        # Créer workspace
        workspace = ws.create_workspace(
            user_id=test_user['id'],
            title="Original Title"
        )
        
        # Mettre à jour
        updated = ws.update_workspace(
            workspace['id'],
            title="Updated Title",
            status=WorkspaceStatus.IN_PROGRESS,
            progress=50
        )
        
        assert updated is not None
        assert updated['title'] == "Updated Title"
        assert updated['status'] == "IN_PROGRESS"
        assert updated['progress'] == 50
        
        print("✅ Workspace mis à jour OK")
    
    def test_list_workspaces(self, test_user):
        """Test listage workspaces"""
        ws = get_workspace_service()
        
        # Créer plusieurs workspaces
        ws.create_workspace(test_user['id'], "WS1", status=WorkspaceStatus.IN_PROGRESS)
        ws.create_workspace(test_user['id'], "WS2", status=WorkspaceStatus.IN_PROGRESS)
        ws.create_workspace(test_user['id'], "WS3", status=WorkspaceStatus.COMPLETED)
        
        # Lister tous
        all_ws = ws.list_workspaces(test_user['id'])
        assert len(all_ws) >= 3
        
        # Filtrer par status
        pending = ws.list_workspaces(test_user['id'], status="NOT_STARTED")
        assert all(w['status'] == "pending" for w in pending)
        
        print(f"✅ Listage OK: {len(all_ws)} workspaces")
    
    def test_add_message(self, test_user):
        """Test ajout message"""
        ws = get_workspace_service()
        
        # Créer workspace
        workspace = ws.create_workspace(test_user['id'], "WS with messages")
        
        # Ajouter messages
        msg1 = ws.add_message(workspace['id'], "user", "Bonjour")
        msg2 = ws.add_message(workspace['id'], "assistant", "Bonjour! Comment puis-je vous aider?")
        
        assert msg1 is not None
        assert msg1['role'] == "USER"
        assert msg1['content'] == "Bonjour"
        
        assert msg2 is not None
        assert msg2['role'] == "ASSISTANT"
        
        # Récupérer messages
        messages = ws.get_workspace_messages(workspace['id'])
        assert len(messages) == 2
        
        print(f"✅ Messages OK: {len(messages)} messages")
    
    def test_delete_workspace(self, test_user):
        """Test suppression workspace"""
        ws = get_workspace_service()
        
        # Créer workspace
        workspace = ws.create_workspace(test_user['id'], "To Delete")
        workspace_id = workspace['id']
        
        # Supprimer
        success = ws.delete_workspace(workspace_id)
        assert success is True
        
        # Vérifier suppression
        deleted = ws.get_workspace(workspace_id)
        assert deleted is None
        
        print("✅ Workspace supprimé OK")


class TestDatabaseService:
    """Tests du service database de base"""
    
    def test_health_check(self):
        """Test connexion database"""
        db = get_database_service()
        
        health = db.health_check()
        assert health is True
        
        print("✅ Database health check OK")
    
    def test_user_stats(self):
        """Test statistiques utilisateur"""
        us = get_user_service()
        ws = get_workspace_service()
        db = get_database_service()
        
        # Créer utilisateur
        username = f"statsuser_{datetime.now().timestamp()}"
        email = f"stats_{datetime.now().timestamp()}@example.com"
        user = us.register_user(username, email, "password123")
        
        # Créer workspaces avec différents statuts
        ws.create_workspace(user['id'], "WS1", status=WorkspaceStatus.NOT_STARTED)
        ws.create_workspace(user['id'], "WS2", status=WorkspaceStatus.IN_PROGRESS)
        ws.create_workspace(user['id'], "WS3", status=WorkspaceStatus.COMPLETED)
        
        # Récupérer stats
        stats = db.get_user_stats(user['id'])
        
        assert stats['total_workspaces'] >= 3
        assert stats['not_started'] >= 1
        assert stats['in_progress'] >= 1
        assert stats['completed'] >= 1
        
        print(f"✅ Stats: {stats}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 TESTS SERVICES POSTGRESQL")
    print("="*60 + "\n")
    
    pytest.main([__file__, "-v", "--tb=short"])
