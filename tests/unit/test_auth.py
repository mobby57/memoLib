"""Tests authentification"""
import pytest
from src.core.auth import AuthManager
from src.core.session_manager import SessionManager
from src.core.validation import Validator
import tempfile
import os

def test_auth_manager():
    auth = AuthManager()
    
    # Test authentification valide
    assert auth.authenticate('password123') == True
    
    # Test mot de passe trop court
    assert auth.authenticate('123') == False

def test_session_manager():
    with tempfile.TemporaryDirectory() as temp_dir:
        session_mgr = SessionManager(temp_dir)
        
        # Test création session
        result = session_mgr.create_session('testpassword123')
        assert result == True
        
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
    
    # Test validation données email
    valid_data = {
        'recipient': 'test@example.com',
        'subject': 'Test',
        'body': 'Message de test'
    }
    is_valid, errors = validator.validate_email_data(valid_data)
    assert is_valid == True
    assert len(errors) == 0