"""
Tests API Authentication
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.backend.main_fastapi import app
from src.backend.database import get_db, Base
from src.backend.models import User
from src.backend.services.auth_service import hash_password, verify_password

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    """Create test database"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    """Create test client"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestAuthAPI:
    """Tests pour l'API Authentication"""
    
    def test_register_user(self, client, db):
        """Test inscription utilisateur"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "password123",
                "name": "New User"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        
        # Vérifier utilisateur créé
        user = db.query(User).filter(User.email == "newuser@example.com").first()
        assert user is not None
        assert user.name == "New User"
        assert verify_password("password123", user.hashed_password)
    
    def test_register_duplicate_email(self, client, db):
        """Test inscription email déjà existant"""
        # Créer utilisateur
        user = User(
            email="existing@example.com",
            name="Existing",
            hashed_password=hash_password("password123"),
            is_active=True
        )
        db.add(user)
        db.commit()
        
        # Essayer de créer avec même email
        response = client.post(
            "/api/auth/register",
            json={
                "email": "existing@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_login_success(self, client, db):
        """Test login réussi"""
        # Créer utilisateur
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=hash_password("password123"),
            is_active=True
        )
        db.add(user)
        db.commit()
        
        # Login
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
    
    def test_login_invalid_credentials(self, client, db):
        """Test login avec mauvais credentials"""
        # Créer utilisateur
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=hash_password("password123"),
            is_active=True
        )
        db.add(user)
        db.commit()
        
        # Login avec mauvais mot de passe
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_inactive_user(self, client, db):
        """Test login utilisateur désactivé"""
        # Créer utilisateur désactivé
        user = User(
            email="inactive@example.com",
            name="Inactive",
            hashed_password=hash_password("password123"),
            is_active=False
        )
        db.add(user)
        db.commit()
        
        # Login
        response = client.post(
            "/api/auth/login",
            json={
                "email": "inactive@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 403
    
    def test_get_current_user(self, client, db):
        """Test récupération utilisateur actuel"""
        from src.backend.services.auth_service import create_access_token
        
        # Créer utilisateur
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=hash_password("password123"),
            is_active=True
        )
        db.add(user)
        db.commit()
        
        # Créer token
        token = create_access_token(data={"sub": user.email})
        
        # Récupérer info utilisateur
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
    
    def test_get_current_user_invalid_token(self, client):
        """Test récupération utilisateur avec token invalide"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401

