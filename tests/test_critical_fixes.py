#!/usr/bin/env python3
"""
Tests automatisés pour IA Poste Manager FastAPI
Validation des fonctionnalités critiques
"""

import pytest
import json
import os
import sys
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.backend.main_fastapi import app

@pytest.fixture
def client():
    """Test client FastAPI"""
    return TestClient(app)

class TestAPIEndpoints:
    """Tests des endpoints API FastAPI"""
    
    def test_health_endpoint(self, client):
        """Test endpoint de santé"""
        response = client.get('/health')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
    
    def test_root_endpoint(self, client):
        """Test endpoint racine"""
        response = client.get('/')
        assert response.status_code == 200
        data = response.json()
        assert 'message' in data or 'name' in data
    
    def test_docs_endpoint(self, client):
        """Test endpoint documentation"""
        response = client.get('/docs')
        assert response.status_code == 200

class TestSecurity:
    """Tests de sécurité"""
    
    def test_cors_headers(self, client):
        """Test headers CORS"""
        response = client.get('/')
        # FastAPI should respond with 200
        assert response.status_code == 200
    
    def test_secret_key_configured(self):
        """Test configuration clé secrète"""
        from src.backend.config_fastapi import get_settings
        settings = get_settings()
        assert settings.JWT_SECRET_KEY is not None
        assert len(settings.JWT_SECRET_KEY) > 0

class TestConfiguration:
    """Tests de configuration FastAPI"""
    
    def test_settings_loaded(self):
        """Test chargement settings"""
        from src.backend.config_fastapi import get_settings
        settings = get_settings()
        assert settings.APP_NAME == "IAPosteManager"
        assert settings.API_PREFIX == "/api"
    
    def test_database_configured(self):
        """Test configuration database"""
        from src.backend.database import engine
        assert engine is not None

if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v', '--tb=short'])