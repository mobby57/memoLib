"""
Configuration globale pour pytest
"""
import pytest
import sys
import os

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(scope="session")
def test_config():
    """Configuration de test"""
    return {
        "database_url": os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:"),
        "secret_key": "test-secret-key",
    }
