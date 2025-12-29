#!/usr/bin/env python3
"""
Tests automatisés pour IA Poste Manager
Validation des fonctionnalités critiques après corrections
"""

import pytest
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app, send_smtp_email

@pytest.fixture
def client():
    """Test client Flask"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_smtp():
    """Mock SMTP pour tests sans envoi réel"""
    with patch('app.smtplib.SMTP') as mock:
        yield mock

class TestEmailSending:
    """Tests d'envoi d'emails"""
    
    def test_send_email_missing_data(self, client):
        """Test envoi email sans données"""
        response = client.post('/api/send-email', 
                             json={})
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_send_email_invalid_email(self, client):
        """Test envoi email avec format invalide"""
        response = client.post('/api/send-email', 
                             json={
                                 'to': 'invalid-email',
                                 'subject': 'Test',
                                 'content': 'Test content'
                             })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid email format' in data['error']
    
    @patch.dict(os.environ, {
        'SMTP_USER': 'test@example.com',
        'SMTP_PASSWORD': 'testpass'
    })
    def test_send_email_success(self, client, mock_smtp):
        """Test envoi email avec succès"""
        # Mock SMTP success
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        response = client.post('/api/send-email', 
                             json={
                                 'to': 'test@example.com',
                                 'subject': 'Test Subject',
                                 'content': 'Test content'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] == True
        assert data['status'] == 'sent'
        
        # Verify SMTP was called
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once()
        mock_server.send_message.assert_called_once()
    
    def test_send_email_no_smtp_config(self, client):
        """Test envoi email sans config SMTP"""
        with patch.dict(os.environ, {}, clear=True):
            response = client.post('/api/send-email', 
                                 json={
                                     'to': 'test@example.com',
                                     'subject': 'Test Subject',
                                     'content': 'Test content'
                                 })
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['success'] == False
            assert data['status'] == 'stored'
            assert 'SMTP not configured' in data['message']

class TestSMTPFunction:
    """Tests de la fonction SMTP"""
    
    @patch.dict(os.environ, {
        'SMTP_USER': 'test@example.com',
        'SMTP_PASSWORD': 'testpass'
    })
    def test_smtp_function_success(self, mock_smtp):
        """Test fonction SMTP avec succès"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = send_smtp_email('test@example.com', 'Subject', 'Content')
        
        assert result == True
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_with('test@example.com', 'testpass')
    
    def test_smtp_function_no_credentials(self):
        """Test fonction SMTP sans credentials"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="SMTP credentials not configured"):
                send_smtp_email('test@example.com', 'Subject', 'Content')
    
    @patch.dict(os.environ, {
        'SMTP_USER': 'test@example.com',
        'SMTP_PASSWORD': 'testpass'
    })
    def test_smtp_function_retry_logic(self, mock_smtp):
        """Test logique de retry SMTP"""
        # Mock failure then success
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        mock_server.send_message.side_effect = [Exception("Network error"), None]
        
        result = send_smtp_email('test@example.com', 'Subject', 'Content')
        
        assert result == True
        assert mock_server.send_message.call_count == 2

class TestAPIEndpoints:
    """Tests des endpoints API"""
    
    def test_health_endpoint(self, client):
        """Test endpoint de santé"""
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
    
    def test_templates_endpoint(self, client):
        """Test endpoint templates"""
        response = client.get('/api/templates')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
    
    def test_create_template(self, client):
        """Test création template"""
        response = client.post('/api/templates', 
                             json={
                                 'name': 'Test Template',
                                 'subject': 'Test Subject',
                                 'content': 'Test Content'
                             })
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['name'] == 'Test Template'
    
    def test_contacts_endpoint(self, client):
        """Test endpoint contacts"""
        response = client.post('/api/contacts', 
                             json={
                                 'name': 'Test Contact',
                                 'email': 'test@example.com',
                                 'company': 'Test Company'
                             })
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['name'] == 'Test Contact'

class TestSecurity:
    """Tests de sécurité"""
    
    def test_cors_headers(self, client):
        """Test headers CORS"""
        response = client.options('/api/send-email')
        # Should have CORS headers configured
        assert response.status_code in [200, 204]
    
    def test_secret_key_generation(self):
        """Test génération clé secrète"""
        with patch.dict(os.environ, {}, clear=True):
            # Import app again to trigger key generation
            import importlib
            import app as app_module
            importlib.reload(app_module)
            
            # Should not raise error and should have a key
            assert app_module.app.config['SECRET_KEY'] is not None
            assert len(app_module.app.config['SECRET_KEY']) > 20

class TestAIGeneration:
    """Tests génération IA"""
    
    def test_generate_without_openai(self, client):
        """Test génération sans OpenAI configuré"""
        with patch('app.client', None):
            response = client.post('/api/generate', 
                                 json={'prompt': 'Test prompt'})
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'content' in data
            assert 'MS CONSEILS' in data['content']
    
    def test_generate_empty_prompt(self, client):
        """Test génération avec prompt vide"""
        response = client.post('/api/generate', 
                             json={'prompt': ''})
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v', '--tb=short'])