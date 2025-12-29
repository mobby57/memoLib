"""
Tests unitaires - Authentication Manager
Coverage: JWT, permissions, document access
"""
import pytest
import os
import tempfile
from datetime import datetime, timedelta
from src.services.auth_manager import (
    AuthenticationManager,
    UserRole,
    Permission,
    DocumentAccessLevel
)


@pytest.fixture
def auth_manager():
    """Créer instance AuthManager avec DB temporaire"""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        db_path = f.name
    
    manager = AuthenticationManager(
        db_path=db_path,
        jwt_secret="test-secret-key-for-testing-only"
    )
    
    yield manager
    
    # Cleanup
    if os.path.exists(db_path):
        os.unlink(db_path)


class TestUserManagement:
    """Tests création et gestion utilisateurs"""
    
    def test_create_user_success(self, auth_manager):
        user_id = auth_manager.create_user(
            username="testuser",
            email="test@example.com",
            password="SecurePass123!",
            role=UserRole.USER
        )
        
        assert user_id is not None
        assert len(user_id) == 36  # UUID format
    
    def test_create_user_duplicate_username(self, auth_manager):
        auth_manager.create_user("testuser", "test1@example.com", "Pass123!", UserRole.USER)
        
        # Tentative doublon
        with pytest.raises(ValueError, match="Username or email already exists"):
            auth_manager.create_user("testuser", "test2@example.com", "Pass456!", UserRole.USER)
    
    def test_create_user_weak_password(self, auth_manager):
        with pytest.raises(ValueError, match="Password must be at least 8 characters"):
            auth_manager.create_user("testuser", "test@example.com", "short", UserRole.USER)


class TestAuthentication:
    """Tests authentification et JWT"""
    
    def test_authenticate_success(self, auth_manager):
        # Créer utilisateur
        auth_manager.create_user("testuser", "test@example.com", "SecurePass123!", UserRole.USER)
        
        # Authentifier
        result = auth_manager.authenticate("testuser", "SecurePass123!")
        
        assert result is not None
        assert 'token' in result
        assert 'user' in result
        assert result['user']['username'] == "testuser"
    
    def test_authenticate_wrong_password(self, auth_manager):
        auth_manager.create_user("testuser", "test@example.com", "SecurePass123!", UserRole.USER)
        
        result = auth_manager.authenticate("testuser", "WrongPassword")
        assert result is None
    
    def test_authenticate_inactive_user(self, auth_manager):
        user_id = auth_manager.create_user("testuser", "test@example.com", "SecurePass123!", UserRole.USER)
        
        # Désactiver utilisateur
        import sqlite3
        with sqlite3.connect(auth_manager.db_path) as conn:
            conn.execute("UPDATE users SET active = 0 WHERE id = ?", (user_id,))
        
        result = auth_manager.authenticate("testuser", "SecurePass123!")
        assert result is None
    
    def test_verify_token_valid(self, auth_manager):
        auth_manager.create_user("testuser", "test@example.com", "SecurePass123!", UserRole.USER)
        auth_result = auth_manager.authenticate("testuser", "SecurePass123!")
        
        token = auth_result['token']
        payload = auth_manager.verify_token(token)
        
        assert payload is not None
        assert payload['username'] == "testuser"
    
    def test_verify_token_expired(self, auth_manager):
        # Créer manager avec expiration 0 heures
        auth_manager.jwt_expiry_hours = 0
        
        auth_manager.create_user("testuser", "test@example.com", "SecurePass123!", UserRole.USER)
        auth_result = auth_manager.authenticate("testuser", "SecurePass123!")
        
        # Token devrait être expiré immédiatement
        import time
        time.sleep(1)
        
        payload = auth_manager.verify_token(auth_result['token'])
        assert payload is None


class TestPermissions:
    """Tests système permissions"""
    
    @pytest.fixture
    def users(self, auth_manager):
        """Créer utilisateurs avec différents rôles"""
        return {
            'admin': auth_manager.create_user("admin", "admin@example.com", "Admin123!", UserRole.ADMIN),
            'manager': auth_manager.create_user("manager", "manager@example.com", "Manager123!", UserRole.MANAGER),
            'user': auth_manager.create_user("user", "user@example.com", "User123!", UserRole.USER),
            'readonly': auth_manager.create_user("readonly", "readonly@example.com", "Readonly123!", UserRole.READONLY)
        }
    
    def test_admin_has_all_permissions(self, auth_manager, users):
        assert auth_manager.has_permission(users['admin'], Permission.DELETE_DOCUMENTS)
        assert auth_manager.has_permission(users['admin'], Permission.MANAGE_USERS)
        assert auth_manager.has_permission(users['admin'], Permission.VIEW_ANALYTICS)
    
    def test_readonly_limited_permissions(self, auth_manager, users):
        assert auth_manager.has_permission(users['readonly'], Permission.READ_DOCUMENTS)
        assert not auth_manager.has_permission(users['readonly'], Permission.CREATE_DOCUMENTS)
        assert not auth_manager.has_permission(users['readonly'], Permission.DELETE_DOCUMENTS)
    
    def test_manager_intermediate_permissions(self, auth_manager, users):
        assert auth_manager.has_permission(users['manager'], Permission.CREATE_DOCUMENTS)
        assert auth_manager.has_permission(users['manager'], Permission.SHARE_DOCUMENTS)
        assert not auth_manager.has_permission(users['manager'], Permission.MANAGE_USERS)


class TestDocumentAccess:
    """Tests contrôle accès documents"""
    
    @pytest.fixture
    def setup_users_and_docs(self, auth_manager):
        """Créer 2 utilisateurs et 1 document"""
        user1 = auth_manager.create_user("user1", "user1@example.com", "Pass123!", UserRole.USER)
        user2 = auth_manager.create_user("user2", "user2@example.com", "Pass123!", UserRole.USER)
        
        return {'user1': user1, 'user2': user2, 'doc_id': 'test-doc-123'}
    
    def test_grant_document_access(self, auth_manager, setup_users_and_docs):
        user1 = setup_users_and_docs['user1']
        user2 = setup_users_and_docs['user2']
        doc_id = setup_users_and_docs['doc_id']
        
        # User1 partage doc avec User2
        auth_manager.grant_document_access(
            document_id=doc_id,
            user_id=user2,
            access_level=DocumentAccessLevel.TEAM,
            granted_by=user1
        )
        
        # User2 devrait avoir accès
        assert auth_manager.can_access_document(user2, doc_id)
    
    def test_revoke_document_access(self, auth_manager, setup_users_and_docs):
        user1 = setup_users_and_docs['user1']
        user2 = setup_users_and_docs['user2']
        doc_id = setup_users_and_docs['doc_id']
        
        # Donner puis révoquer accès
        auth_manager.grant_document_access(doc_id, user2, DocumentAccessLevel.TEAM, user1)
        auth_manager.revoke_document_access(doc_id, user2, user1)
        
        # User2 ne devrait plus avoir accès
        assert not auth_manager.can_access_document(user2, doc_id)


class TestSecurity:
    """Tests sécurité (hashing, tokens)"""
    
    def test_password_hashed(self, auth_manager):
        user_id = auth_manager.create_user("testuser", "test@example.com", "SecurePass123!", UserRole.USER)
        
        # Vérifier que password n'est pas stocké en clair
        import sqlite3
        with sqlite3.connect(auth_manager.db_path) as conn:
            cursor = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
            stored_hash = cursor.fetchone()[0]
        
        assert stored_hash != "SecurePass123!"
        assert stored_hash.startswith("pbkdf2:sha256:")
    
    def test_logout_invalidates_session(self, auth_manager):
        auth_manager.create_user("testuser", "test@example.com", "SecurePass123!", UserRole.USER)
        auth_result = auth_manager.authenticate("testuser", "SecurePass123!")
        
        token = auth_result['token']
        
        # Vérifier token valide avant logout
        assert auth_manager.verify_token(token) is not None
        
        # Logout
        auth_manager.logout(token)
        
        # Token devrait être invalidé
        assert auth_manager.verify_token(token) is None


@pytest.mark.asyncio
class TestPerformance:
    """Tests performance"""
    
    async def test_verify_token_fast(self, auth_manager):
        """Vérification token doit être <10ms"""
        auth_manager.create_user("testuser", "test@example.com", "SecurePass123!", UserRole.USER)
        auth_result = auth_manager.authenticate("testuser", "SecurePass123!")
        
        token = auth_result['token']
        
        import time
        start = time.time()
        for _ in range(100):
            auth_manager.verify_token(token)
        elapsed = time.time() - start
        
        # 100 vérifications en moins de 100ms
        assert elapsed < 0.1, f"Token verification trop lent: {elapsed*10}ms par vérification"
