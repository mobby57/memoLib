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
    # Simuler session authentifiée
    with client.session_transaction() as sess:
        sess['authenticated'] = True
        sess['master_password'] = 'testpassword123'
        sess['created_at'] = 1234567890
    return client