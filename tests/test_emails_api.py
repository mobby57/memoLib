"""
Tests API Emails
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
from src.backend.models import User, Email
from src.backend.services.auth_service import hash_password, create_access_token

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


@pytest.fixture
def test_user(db):
    """Create test user"""
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password=hash_password("password123"),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user):
    """Create auth token"""
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def auth_headers(auth_token):
    """Create auth headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestEmailsAPI:
    """Tests pour l'API Emails"""
    
    def test_send_email(self, client, auth_headers):
        """Test envoi email"""
        response = client.post(
            "/api/emails",
            json={
                "to": "recipient@example.com",
                "subject": "Test Email",
                "body": "This is a test email"
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["to"] == "recipient@example.com"
        assert data["subject"] == "Test Email"
        assert data["status"] == "sent"
        assert "id" in data
    
    def test_send_email_unauthorized(self, client):
        """Test envoi email sans auth"""
        response = client.post(
            "/api/emails",
            json={
                "to": "recipient@example.com",
                "subject": "Test",
                "body": "Test"
            }
        )
        assert response.status_code == 403
    
    def test_get_email_history(self, client, db, test_user, auth_headers):
        """Test récupération historique emails"""
        # Créer email
        email = Email(
            user_id=test_user.id,
            to_email="recipient@example.com",
            subject="Test Email",
            body="Test body",
            status="sent"
        )
        db.add(email)
        db.commit()
        
        # Récupérer historique
        response = client.get("/api/email-history", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["subject"] == "Test Email"
    
    def test_get_email_by_id(self, client, db, test_user, auth_headers):
        """Test récupération email par ID"""
        email = Email(
            user_id=test_user.id,
            to_email="recipient@example.com",
            subject="Test Email",
            body="Test body",
            status="sent"
        )
        db.add(email)
        db.commit()
        
        response = client.get(f"/api/emails/{email.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["subject"] == "Test Email"
    
    def test_email_isolation(self, client, db, test_user, auth_headers):
        """Test isolation emails entre utilisateurs"""
        # Créer deuxième utilisateur
        user2 = User(
            email="user2@example.com",
            name="User 2",
            hashed_password=hash_password("password123"),
            is_active=True
        )
        db.add(user2)
        db.commit()
        
        # Email pour user1
        email1 = Email(
            user_id=test_user.id,
            to_email="recipient1@example.com",
            subject="Email User1",
            body="Body 1",
            status="sent"
        )
        db.add(email1)
        
        # Email pour user2
        email2 = Email(
            user_id=user2.id,
            to_email="recipient2@example.com",
            subject="Email User2",
            body="Body 2",
            status="sent"
        )
        db.add(email2)
        db.commit()
        
        # User1 ne doit voir que son email
        response = client.get("/api/email-history", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["to"] == "recipient1@example.com"

