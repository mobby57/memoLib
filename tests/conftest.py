"""Configuration pytest"""
import pytest
import os
import tempfile

# Set required environment variables before importing app
if not os.environ.get('SECRET_KEY'):
    os.environ['SECRET_KEY'] = 'test-secret-key-for-pytest'
if not os.environ.get('FLASK_ENV'):
    os.environ['FLASK_ENV'] = 'testing'

from src.core.database import Database
from src.web.app import app

@pytest.fixture
def test_db():
    """Base de données temporaire pour tests"""
    db_fd, db_path = tempfile.mkstemp()
    db = Database(db_path)
    yield db
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client():
    """Client Flask pour tests"""
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-key'
    
    with app.test_client() as client:
        with app.app_context():
            yield client

@pytest.fixture
def authenticated_client(client):
    """Client authentifié"""
    # Simuler authentification via API directe
    with client.application.app_context():
        from flask import session
        with client.session_transaction() as sess:
            sess['authenticated'] = True
            sess['master_password'] = 'testpassword123'
            sess['login_time'] = '2024-01-01T00:00:00'
    return client

@pytest.fixture
def temp_dir():
    """Répertoire temporaire pour tests"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir

@pytest.fixture
def test_email():
    """Email de test"""
    return 'test@example.com'

@pytest.fixture
def test_app_password():
    """Mot de passe app de test"""
    return 'test-app-password-1234'

@pytest.fixture
def test_api_key():
    """Clé API de test"""
    return 'test-api-key-xyz'

@pytest.fixture
def master_password():
    """Mot de passe maître de test"""
    return 'TestMasterPassword123!'