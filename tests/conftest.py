"""
Configuration pytest et fixtures communes
"""
import pytest
import sys
from pathlib import Path

# Ajout du répertoire racine au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def app():
    """Fixture Flask app pour tests d'intégration"""
    from app import app as flask_app
    flask_app.config['TESTING'] = True
    flask_app.config['WTF_CSRF_ENABLED'] = False
    
    yield flask_app


@pytest.fixture
def client(app):
    """Fixture client de test Flask"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Fixture CLI runner"""
    return app.test_cli_runner()


@pytest.fixture
def sample_client_data():
    """Données client de test"""
    return {
        'nom': 'Test',
        'prenom': 'Client',
        'email': 'test@example.com',
        'telephone': '0601020304',
        'adresse': '123 Rue Test, 75001 Paris',
        'numero_dossier': 'TEST-2024-0001',
        'type_affaire': 'Test'
    }


@pytest.fixture
def sample_invoice_data():
    """Données de facture de test"""
    return {
        'numero_facture': 'FAC-2024-TEST',
        'date': '2024-01-15',
        'cabinet': {
            'nom': 'Cabinet Test',
            'adresse': '123 Rue Test',
            'code_postal': '75001',
            'ville': 'Paris',
            'siret': '123 456 789 00012',
            'tva': 'FR12345678901'
        },
        'client': {
            'nom': 'Client Test',
            'adresse': '456 Avenue Test',
            'code_postal': '75010',
            'ville': 'Paris'
        },
        'numero_dossier': 'TEST-2024-0001',
        'prestations': [
            {'description': 'Consultation test', 'quantite': 1, 'prix_unitaire': 100.00}
        ],
        'tva_taux': 20.0
    }
