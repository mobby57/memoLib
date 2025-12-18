"""Tests API endpoints"""
import pytest
import json

def test_health_endpoint(client):
    """Test endpoint de santé"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'ok'
    assert 'version' in data

def test_login_endpoint(client):
    """Test endpoint de connexion"""
    # Test avec mot de passe valide
    response = client.post('/api/login', 
        data=json.dumps({'password': 'testpassword123'}),
        content_type='application/json'
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    
    # Test avec mot de passe invalide
    response = client.post('/api/login',
        data=json.dumps({'password': '123'}),
        content_type='application/json'
    )
    assert response.status_code in [401, 403]

def test_stats_endpoint_unauthorized(client):
    """Test stats sans authentification"""
    response = client.get('/api/stats')
    assert response.status_code == 401

def test_stats_endpoint_authorized(authenticated_client):
    """Test stats avec authentification"""
    response = authenticated_client.get('/api/stats')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'envois' in data
    assert 'ia' in data

def test_send_email_validation(authenticated_client):
    """Test validation envoi email"""
    # Test données manquantes
    response = authenticated_client.post('/api/send-email',
        data=json.dumps({'recipient': 'test@example.com'}),
        content_type='application/json'
    )
    assert response.status_code == 400
    
    # Test email invalide
    response = authenticated_client.post('/api/send-email',
        data=json.dumps({
            'recipient': 'invalid-email',
            'subject': 'Test',
            'body': 'Message'
        }),
        content_type='application/json'
    )
    assert response.status_code == 400