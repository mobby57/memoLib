"""
Tests API Contacts
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
from src.backend.models import User, Contact
from src.backend.services.auth_service import hash_password, create_access_token

# Test database (SQLite in-memory)
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
    """Create auth token for test user"""
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def auth_headers(auth_token):
    """Create auth headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestContactsAPI:
    """Tests pour l'API Contacts"""
    
    def test_create_contact(self, client, auth_headers):
        """Test création contact"""
        response = client.post(
            "/api/contacts",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+33123456789"
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["email"] == "john@example.com"
        assert "id" in data
    
    def test_create_contact_unauthorized(self, client):
        """Test création contact sans auth"""
        response = client.post(
            "/api/contacts",
            json={
                "name": "John Doe",
                "email": "john@example.com"
            }
        )
        assert response.status_code == 403
    
    def test_get_contacts(self, client, db, test_user, auth_headers):
        """Test récupération contacts"""
        # Créer un contact
        contact = Contact(
            user_id=test_user.id,
            name="John Doe",
            email="john@example.com"
        )
        db.add(contact)
        db.commit()
        
        # Récupérer contacts
        response = client.get("/api/contacts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "John Doe"
    
    def test_get_contact_by_id(self, client, db, test_user, auth_headers):
        """Test récupération contact par ID"""
        contact = Contact(
            user_id=test_user.id,
            name="John Doe",
            email="john@example.com"
        )
        db.add(contact)
        db.commit()
        
        response = client.get(f"/api/contacts/{contact.id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "John Doe"
    
    def test_update_contact(self, client, db, test_user, auth_headers):
        """Test mise à jour contact"""
        contact = Contact(
            user_id=test_user.id,
            name="John Doe",
            email="john@example.com"
        )
        db.add(contact)
        db.commit()
        
        response = client.put(
            f"/api/contacts/{contact.id}",
            json={"name": "Jane Doe"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Jane Doe"
    
    def test_delete_contact(self, client, db, test_user, auth_headers):
        """Test suppression contact"""
        contact = Contact(
            user_id=test_user.id,
            name="John Doe",
            email="john@example.com"
        )
        db.add(contact)
        db.commit()
        contact_id = contact.id
        
        response = client.delete(f"/api/contacts/{contact_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Vérifier suppression
        response = client.get(f"/api/contacts/{contact_id}", headers=auth_headers)
        assert response.status_code == 404
    
    def test_contact_isolation(self, client, db, test_user, auth_headers):
        """Test isolation données entre utilisateurs"""
        # Créer deuxième utilisateur
        user2 = User(
            email="user2@example.com",
            name="User 2",
            hashed_password=hash_password("password123"),
            is_active=True
        )
        db.add(user2)
        db.commit()
        
        # Contact pour user1
        contact1 = Contact(
            user_id=test_user.id,
            name="Contact User1",
            email="contact1@example.com"
        )
        db.add(contact1)
        
        # Contact pour user2
        contact2 = Contact(
            user_id=user2.id,
            name="Contact User2",
            email="contact2@example.com"
        )
        db.add(contact2)
        db.commit()
        
        # User1 ne doit voir que son contact
        response = client.get("/api/contacts", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["email"] == "contact1@example.com"

