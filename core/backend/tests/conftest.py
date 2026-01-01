"""
Configuration partagée pour tous les tests
Fixtures réutilisables et configuration de base
"""
import pytest
import os
import tempfile
from datetime import datetime, timedelta

# Configuration environnement de test
os.environ['FLASK_ENV'] = 'testing'
os.environ['SECRET_KEY'] = 'test-secret-key-minimum-32-chars-for-security-compliance'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-key-minimum-32-chars-compliance'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import app as flask_app, db
from database import User, Dossier, Facture, AuditTrail
from models_extended import Client, Document, RendezVous, Deadline, Note, EmailTemplate, Notification

# ============================================
# CONFIGURATION DATABASE
# ============================================

@pytest.fixture(scope='function')
def app():
    """
    Application Flask configurée pour tests
    Scope 'function' = nouvelle DB pour chaque test
    """
    flask_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'WTF_CSRF_ENABLED': False,
        'SECRET_KEY': 'test-secret-key-minimum-32-chars-for-security-compliance',
        'JWT_SECRET_KEY': 'test-jwt-secret-key-minimum-32-chars-compliance',
        'JWT_ACCESS_TOKEN_EXPIRES': timedelta(hours=1)
    })
    
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Client HTTP pour tester les routes"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """CLI runner pour tester les commandes"""
    return app.test_cli_runner()

# ============================================
# FIXTURES - AUTHENTIFICATION
# ============================================

@pytest.fixture
def test_user(app):
    """
    Utilisateur standard pour tests
    Role: user
    """
    with app.app_context():
        from werkzeug.security import generate_password_hash
        
        user = User(
            username='testuser',
            email='testuser@test.com',
            password_hash=generate_password_hash('TestPassword123!'),
            role='user'
        )
        db.session.add(user)
        db.session.commit()
        
        # Refresh pour éviter DetachedInstanceError
        db.session.refresh(user)
        return user

@pytest.fixture
def admin_user(app):
    """
    Administrateur pour tests
    Role: admin
    """
    with app.app_context():
        from werkzeug.security import generate_password_hash
        
        admin = User(
            username='admin',
            email='admin@test.com',
            password_hash=generate_password_hash('AdminPass123!'),
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        
        db.session.refresh(admin)
        return admin

@pytest.fixture
def auth_token(app, test_user):
    """Token JWT valide pour authentification"""
    with app.app_context():
        from flask_jwt_extended import create_access_token
        
        token = create_access_token(identity=test_user.id)
        return token

@pytest.fixture
def auth_headers(auth_token):
    """Headers HTTP avec authentification JWT"""
    return {
        'Authorization': f'Bearer {auth_token}',
        'Content-Type': 'application/json'
    }

@pytest.fixture
def admin_token(app, admin_user):
    """Token JWT admin"""
    with app.app_context():
        from flask_jwt_extended import create_access_token
        
        token = create_access_token(identity=admin_user.id)
        return token

@pytest.fixture
def admin_headers(admin_token):
    """Headers HTTP avec authentification admin"""
    return {
        'Authorization': f'Bearer {admin_token}',
        'Content-Type': 'application/json'
    }

# ============================================
# FIXTURES - DONNÉES DE TEST
# ============================================

@pytest.fixture
def test_client_model(app):
    """Client pour tests (modèle Client)"""
    with app.app_context():
        client = Client(
            nom='Dupont',
            prenom='Jean',
            email='jean.dupont@test.com',
            telephone='0601020304',
            nationalite='Française',
            date_naissance=datetime(1990, 1, 1).date(),
            adresse='1 Rue de Test, 75001 Paris'
        )
        db.session.add(client)
        db.session.commit()
        
        db.session.refresh(client)
        return client

@pytest.fixture
def test_dossier(app, test_user, test_client_model):
    """Dossier pour tests"""
    with app.app_context():
        dossier = Dossier(
            numero='D-2026-001',
            client_nom=f'{test_client_model.nom} {test_client_model.prenom}',
            type_dossier='titre_sejour',
            statut='en_cours',
            created_by=test_user.id,
            description='Dossier de test'
        )
        db.session.add(dossier)
        db.session.commit()
        
        db.session.refresh(dossier)
        return dossier

@pytest.fixture
def test_facture(app, test_dossier):
    """Facture pour tests"""
    with app.app_context():
        facture = Facture(
            numero='F-2026-001',
            dossier_id=test_dossier.id,
            montant_ht=1000.0,
            tva=200.0,
            montant_ttc=1200.0,
            date_emission=datetime.now().date(),
            statut='en_attente'
        )
        db.session.add(facture)
        db.session.commit()
        
        db.session.refresh(facture)
        return facture

@pytest.fixture
def test_document(app, test_client_model):
    """Document pour tests"""
    with app.app_context():
        doc = Document(
            filename='test_passport.pdf',
            original_filename='passport_dupont.pdf',
            file_path='/uploads/test/test_passport.pdf',
            type_document='passport',
            client_id=test_client_model.id,
            verified=False
        )
        db.session.add(doc)
        db.session.commit()
        
        db.session.refresh(doc)
        return doc

@pytest.fixture
def test_rendez_vous(app, test_client_model):
    """Rendez-vous pour tests"""
    with app.app_context():
        rdv = RendezVous(
            client_id=test_client_model.id,
            date=datetime.now() + timedelta(days=7),
            type_rdv='consultation',
            statut='confirme',
            lieu='Bureau du cabinet',
            notes='Premier rendez-vous'
        )
        db.session.add(rdv)
        db.session.commit()
        
        db.session.refresh(rdv)
        return rdv

@pytest.fixture
def test_deadline(app, test_dossier):
    """Deadline pour tests"""
    with app.app_context():
        deadline = Deadline(
            dossier_id=test_dossier.id,
            titre='Dépôt dossier préfecture',
            date_limite=datetime.now() + timedelta(days=30),
            priorite='haute',
            statut='a_faire'
        )
        db.session.add(deadline)
        db.session.commit()
        
        db.session.refresh(deadline)
        return deadline

@pytest.fixture
def test_note(app, test_dossier, test_user):
    """Note pour tests"""
    with app.app_context():
        note = Note(
            dossier_id=test_dossier.id,
            contenu='Note de test pour le dossier',
            auteur_id=test_user.id
        )
        db.session.add(note)
        db.session.commit()
        
        db.session.refresh(note)
        return note

@pytest.fixture
def test_email_template(app):
    """Template email pour tests"""
    with app.app_context():
        template = EmailTemplate(
            nom='Confirmation RDV',
            sujet='Confirmation de votre rendez-vous',
            contenu='Bonjour {client_nom}, votre RDV est confirmé le {date_rdv}.',
            variables=['client_nom', 'date_rdv']
        )
        db.session.add(template)
        db.session.commit()
        
        db.session.refresh(template)
        return template

@pytest.fixture
def test_notification(app, test_user):
    """Notification pour tests"""
    with app.app_context():
        notif = Notification(
            user_id=test_user.id,
            titre='Test Notification',
            message='Ceci est une notification de test',
            type='info',
            lu=False
        )
        db.session.add(notif)
        db.session.commit()
        
        db.session.refresh(notif)
        return notif

# ============================================
# FIXTURES - FICHIERS TEMPORAIRES
# ============================================

@pytest.fixture
def temp_upload_dir():
    """Répertoire temporaire pour uploads"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir

@pytest.fixture
def mock_pdf_file(temp_upload_dir):
    """Fichier PDF de test"""
    pdf_path = os.path.join(temp_upload_dir, 'test.pdf')
    
    # Créer un faux PDF (header PDF minimal)
    with open(pdf_path, 'wb') as f:
        f.write(b'%PDF-1.4\n%Test PDF\n%%EOF')
    
    yield pdf_path
    
    # Cleanup automatique par tempfile

@pytest.fixture
def mock_image_file(temp_upload_dir):
    """Fichier image de test"""
    img_path = os.path.join(temp_upload_dir, 'test.jpg')
    
    # Créer une fausse image JPEG (header JPEG minimal)
    with open(img_path, 'wb') as f:
        f.write(b'\xFF\xD8\xFF\xE0\x00\x10JFIF')
    
    yield img_path

# ============================================
# FIXTURES - MOCKS EXTERNES
# ============================================

@pytest.fixture
def mock_ollama_response():
    """Mock réponse Ollama IA"""
    return {
        'model': 'mistral',
        'response': 'Ce document est un passeport valide.',
        'done': True,
        'context': [],
        'total_duration': 1000000,
        'load_duration': 500000,
        'prompt_eval_count': 10,
        'eval_count': 20
    }

@pytest.fixture
def mock_smtp_server(mocker):
    """Mock serveur SMTP pour tests email"""
    mock_smtp = mocker.patch('smtplib.SMTP')
    mock_instance = mock_smtp.return_value.__enter__.return_value
    mock_instance.send_message.return_value = {}
    return mock_instance

# ============================================
# HOOKS PYTEST
# ============================================

def pytest_configure(config):
    """Configuration globale pytest"""
    config.addinivalue_line(
        "markers", "unit: Tests unitaires isolés"
    )
    config.addinivalue_line(
        "markers", "integration: Tests d'intégration"
    )
    config.addinivalue_line(
        "markers", "slow: Tests lents (>1s)"
    )

@pytest.fixture(autouse=True)
def reset_database(app):
    """
    Reset automatique de la DB entre chaque test
    autouse=True = appliqué à TOUS les tests
    """
    with app.app_context():
        # Cleanup avant test
        db.session.remove()
        db.drop_all()
        db.create_all()
        
        yield
        
        # Cleanup après test
        db.session.remove()
        db.drop_all()

# ============================================
# HELPERS DE TEST
# ============================================

@pytest.fixture
def assert_audit_logged(app):
    """Helper pour vérifier qu'un audit a été créé"""
    def _assert(action, resource_type, user_id=None):
        with app.app_context():
            query = AuditTrail.query.filter_by(
                action=action,
                resource_type=resource_type
            )
            
            if user_id:
                query = query.filter_by(user_id=user_id)
            
            audit = query.first()
            assert audit is not None, f"Aucun audit trouvé pour {action} {resource_type}"
            return audit
    
    return _assert

@pytest.fixture
def create_test_dossiers(app, test_user):
    """Helper pour créer plusieurs dossiers de test"""
    def _create(count=5):
        with app.app_context():
            dossiers = []
            for i in range(count):
                dossier = Dossier(
                    numero=f'D-2026-{str(i+1).zfill(3)}',
                    client_nom=f'Client Test {i+1}',
                    type_dossier='titre_sejour',
                    statut='en_cours',
                    created_by=test_user.id
                )
                db.session.add(dossier)
                dossiers.append(dossier)
            
            db.session.commit()
            
            # Refresh all
            for d in dossiers:
                db.session.refresh(d)
            
            return dossiers
    
    return _create

@pytest.fixture
def json_response_validator():
    """Helper pour valider les réponses JSON"""
    def _validate(response, expected_status=200, expected_keys=None):
        assert response.status_code == expected_status, \
            f"Status attendu: {expected_status}, reçu: {response.status_code}"
        
        if response.content_type and 'application/json' in response.content_type:
            data = response.get_json()
            
            if expected_keys:
                for key in expected_keys:
                    assert key in data, f"Clé manquante: {key}"
            
            return data
        
        return None
    
    return _validate
