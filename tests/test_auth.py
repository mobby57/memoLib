"""Tests authentification"""
import pytest
from src.core.auth import AuthManager
from src.core.session_manager import SessionManager
from src.core.validation import Validator
import tempfile
import os

def test_auth_manager(client):
    """Test auth manager with Flask context"""
    with client.application.app_context():
        with client.application.test_request_context():
            auth = AuthManager()
            
            # Test authentification valide (returns session token)
            result = auth.authenticate('password123')
            assert result is not None
            
            # Test mot de passe trop court
            result_short = auth.authenticate('123')
            assert result_short is False or result_short is None

def test_session_manager():
    with tempfile.TemporaryDirectory() as temp_dir:
        session_mgr = SessionManager(temp_dir)
        
        # Test création session - returns session ID string
        result = session_mgr.create_session('testpassword123')
        assert result  # Should return truthy value (session ID)
        assert isinstance(result, (str, bool))  # Accept session ID or boolean
        
        # Test récupération mot de passe
        password = session_mgr.get_master_password()
        assert password == 'testpassword123'

def test_validator():
    validator = Validator()
    
    # Test validation email
    assert validator.validate_email('test@example.com') == True
    assert validator.validate_email('invalid-email') == False
    
    # Test sanitisation
    dirty_input = '<script>alert("xss")</script>'
    clean_input = validator.sanitize_input(dirty_input)
    assert '<script>' not in clean_input
    
    # Test validation données (generic)
    valid_data = {
        'email': 'test@example.com',
        'password': 'Test123!@#'
    }
    is_valid = validator.validate(valid_data)
    assert is_valid == True