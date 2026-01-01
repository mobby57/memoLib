"""
Tests unitaires COMPLETS - 100% Coverage
Version optimisée pour couverture maximale
"""
import pytest
import os
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Configuration environnement AVANT imports
os.environ['FLASK_ENV'] = 'testing'
os.environ['SECRET_KEY'] = 'test-secret-key-minimum-32-chars-for-security-12345'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-key-minimum-32-chars-12345'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from app import app as flask_app, db
from database import User, Dossier, Facture, AuditTrail
from models_extended import Client, Document
from audit_utils import log_audit, get_resource_history, get_user_activity, search_audit
from db_helpers import (
    get_all_dossiers_with_creator,
    get_dossier_by_id,
    create_dossier,
    update_dossier,
    delete_dossier,
    get_all_factures,
    get_facture_by_id,
    create_facture,
    get_dashboard_stats
)

# ============================================
# FIXTURES
# ============================================

@pytest.fixture
def app():
    """Application Flask pour tests"""
    flask_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'WTF_CSRF_ENABLED': False,
    })
    
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_user(app):
    """Utilisateur de test"""
    with app.app_context():
        from werkzeug.security import generate_password_hash
        user = User(
            username='testuser',
            email='test@test.com',
            password_hash=generate_password_hash('pass123'),
            role='user'
        )
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)
        return user

@pytest.fixture
def test_dossier(app, test_user):
    """Dossier de test"""
    with app.app_context():
        dossier = Dossier(
            numero='D-2026-001',
            client_nom='Test Client',
            type_dossier='titre_sejour',
            statut='nouveau',
            created_by=test_user.id
        )
        db.session.add(dossier)
        db.session.commit()
        db.session.refresh(dossier)
        return dossier

@pytest.fixture
def test_facture(app, test_dossier):
    """Facture de test"""
    with app.app_context():
        facture = Facture(
            numero='F-2026-001',
            dossier_id=test_dossier.id,
            client_nom='Test Client',
            montant_ht=1000.0,
            tva=200.0,
            montant_ttc=1200.0,
            date_emission=datetime.now().date()
        )
        db.session.add(facture)
        db.session.commit()
        db.session.refresh(facture)
        return facture

# ============================================
# TESTS DB_HELPERS - 100% COVERAGE
# ============================================

class TestDbHelpers:
    """Tests pour db_helpers.py - Coverage 100%"""
    
    def test_get_all_dossiers_empty(self, app):
        """Test liste vide"""
        with app.app_context():
            result = get_all_dossiers_with_creator()
            assert isinstance(result, list)
            assert len(result) == 0
    
    def test_get_all_dossiers_with_data(self, app, test_dossier):
        """Test avec données"""
        with app.app_context():
            result = get_all_dossiers_with_creator()
            assert len(result) > 0
    
    def test_get_dossier_by_id_found(self, app, test_dossier):
        """Test récupération dossier existant"""
        with app.app_context():
            result = get_dossier_by_id(test_dossier.id)
            assert result is not None
            assert result['numero'] == 'D-2026-001'
            assert 'created_by_name' in result
    
    def test_get_dossier_by_id_not_found(self, app):
        """Test dossier inexistant"""
        with app.app_context():
            result = get_dossier_by_id(99999)
            assert result is None
    
    def test_create_dossier_success(self, app, test_user):
        """Test création dossier"""
        with app.app_context():
            data = {
                'numero': 'D-NEW-001',
                'client_nom': 'New Client',
                'type_dossier': 'naturalisation'
            }
            dossier = create_dossier(data, test_user.id)
            assert dossier.id is not None
            assert dossier.numero == 'D-NEW-001'
    
    def test_update_dossier_success(self, app, test_dossier):
        """Test mise à jour dossier"""
        with app.app_context():
            data = {'statut': 'en_cours', 'description': 'Updated'}
            result = update_dossier(test_dossier.id, data)
            assert result is True
            
            # Vérifier changement
            updated = db.session.get(Dossier, test_dossier.id)
            assert updated.statut == 'en_cours'
    
    def test_update_dossier_not_found(self, app):
        """Test update dossier inexistant"""
        with app.app_context():
            result = update_dossier(99999, {'statut': 'test'})
            assert result is False
    
    def test_update_dossier_all_fields(self, app, test_dossier):
        """Test update tous les champs possibles"""
        with app.app_context():
            data = {
                'client_nom': 'Updated Name',
                'client_email': 'updated@test.com',
                'type_dossier': 'naturalisation',
                'statut': 'termine',
                'description': 'Fully updated'
            }
            result = update_dossier(test_dossier.id, data)
            assert result is True
            
            # Vérifier tous les champs
            updated = db.session.get(Dossier, test_dossier.id)
            assert updated.client_nom == 'Updated Name'
            assert updated.client_email == 'updated@test.com'
            assert updated.description == 'Fully updated'
    
    def test_delete_dossier_success(self, app, test_dossier):
        """Test suppression dossier"""
        with app.app_context():
            dossier_id = test_dossier.id
            result = delete_dossier(dossier_id)
            assert result is True
            
            # Vérifier suppression
            deleted = db.session.get(Dossier, dossier_id)
            assert deleted is None
    
    def test_delete_dossier_not_found(self, app):
        """Test delete dossier inexistant"""
        with app.app_context():
            result = delete_dossier(99999)
            assert result is False
    
    def test_get_all_factures(self, app, test_facture):
        """Test liste factures"""
        with app.app_context():
            result = get_all_factures()
            assert len(result) > 0
    
    def test_get_facture_by_id_found(self, app, test_facture):
        """Test récupération facture"""
        with app.app_context():
            result = get_facture_by_id(test_facture.id)
            assert result is not None
            assert result['numero'] == 'F-2026-001'
    
    def test_get_facture_by_id_not_found(self, app):
        """Test facture inexistante"""
        with app.app_context():
            result = get_facture_by_id(99999)
            assert result is None
    
    def test_create_facture_success(self, app, test_dossier):
        """Test création facture"""
        with app.app_context():
            data = {
                'numero': 'F-NEW-001',
                'dossier_id': test_dossier.id,
                'client_nom': 'Test',
                'montant_ht': 500.0,
                'montant_ttc': 600.0
            }
            facture = create_facture(data)
            assert facture.id is not None
            assert facture.numero == 'F-NEW-001'
    
    def test_get_dashboard_stats(self, app, test_dossier, test_facture):
        """Test statistiques dashboard"""
        with app.app_context():
            stats = get_dashboard_stats()
            
            assert 'total_dossiers' in stats
            assert 'total_factures' in stats
            assert 'total_chiffre_affaires' in stats
            assert stats['total_dossiers'] >= 1
            assert stats['total_factures'] >= 1

# ============================================
# TESTS AUDIT_UTILS - 100% COVERAGE
# ============================================

class TestAuditUtils:
    """Tests pour audit_utils.py - Coverage 100%"""
    
    def test_log_audit_success(self, app, test_user):
        """Test création audit"""
        with app.app_context():
            with app.test_request_context():
                result = log_audit(
                    user_id=test_user.id,
                    action='create',
                    resource_type='dossier',
                    resource_id=123,
                    details='Test audit entry'
                )
                assert result is True
                
                # Vérifier création
                audit = AuditTrail.query.first()
                assert audit is not None
                assert audit.action == 'create'
    
    def test_log_audit_without_request(self, app, test_user):
        """Test audit sans contexte request"""
        with app.app_context():
            result = log_audit(test_user.id, 'test', 'resource', 1)
            assert result is True
    
    def test_get_resource_history(self, app, test_user):
        """Test historique ressource"""
        with app.app_context():
            with app.test_request_context():
                # Créer audits
                log_audit(test_user.id, 'create', 'dossier', 123)
                log_audit(test_user.id, 'update', 'dossier', 123)
                
                history = get_resource_history('dossier', 123, limit=10)
                assert len(history) == 2
    
    def test_get_user_activity(self, app, test_user):
        """Test activité utilisateur"""
        with app.app_context():
            with app.test_request_context():
                log_audit(test_user.id, 'login', 'user', test_user.id)
                log_audit(test_user.id, 'view', 'dossier', 1)
                
                activity = get_user_activity(test_user.id, limit=10)
                assert len(activity) >= 2
    
    def test_search_audit_by_user(self, app, test_user):
        """Test recherche par user_id"""
        with app.app_context():
            with app.test_request_context():
                log_audit(test_user.id, 'delete', 'facture', 1)
                
                results = search_audit({'user_id': test_user.id}, limit=10)
                assert len(results) >= 1
    
    def test_search_audit_by_action(self, app, test_user):
        """Test recherche par action"""
        with app.app_context():
            with app.test_request_context():
                log_audit(test_user.id, 'export', 'report', 1)
                
                results = search_audit({'action': 'export'}, limit=10)
                assert len(results) >= 1
    
    def test_search_audit_by_resource_type(self, app, test_user):
        """Test recherche par resource_type"""
        with app.app_context():
            with app.test_request_context():
                log_audit(test_user.id, 'view', 'document', 1)
                
                results = search_audit({'resource_type': 'document'}, limit=10)
                assert len(results) >= 1
    
    def test_search_audit_by_date(self, app, test_user):
        """Test recherche par dates"""
        with app.app_context():
            with app.test_request_context():
                log_audit(test_user.id, 'test', 'test', 1)
                
                filters = {
                    'date_debut': datetime.now() - timedelta(days=1),
                    'date_fin': datetime.now() + timedelta(days=1)
                }
                results = search_audit(filters, limit=10)
                assert len(results) >= 1
    
    def test_search_audit_with_resource_id(self, app, test_user):
        """Test recherche avec resource_id"""
        with app.app_context():
            with app.test_request_context():
                log_audit(test_user.id, 'view', 'dossier', 42, 'View dossier 42')
                
                results = search_audit({'resource_id': 42}, limit=10)
                assert len(results) >= 1
    
    def test_log_audit_error_handling(self, app):
        """Test gestion erreur log_audit avec rollback"""
        with app.app_context():
            with app.test_request_context():
                # Forcer une erreur lors du commit pour trigger les lignes 39-42
                with patch('audit_utils.db.session.commit', side_effect=Exception('DB Error')):
                    with patch('audit_utils.db.session.rollback') as mock_rollback:
                        result = log_audit(1, 'test', 'test')
                        assert result is False
                        # Vérifier que rollback a été appelé (ligne 41)
                        mock_rollback.assert_called_once()
    
    def test_get_resource_history_error(self, app):
        """Test gestion erreur get_resource_history - lignes 65-67"""
        with app.app_context():
            # Simuler une erreur de requête pour déclencher l'exception
            with patch('audit_utils.AuditTrail.query') as mock_query:
                mock_query.filter_by.side_effect = Exception('Database connection lost')
                history = get_resource_history('test', 1, limit=10)
                # Vérifier que le bloc except retourne une liste vide (ligne 67)
                assert isinstance(history, list)
                assert len(history) == 0
    
    def test_get_user_activity_error(self, app):
        """Test gestion erreur get_user_activity - lignes 89-91"""
        with app.app_context():
            # Simuler une erreur de requête pour déclencher l'exception
            with patch('audit_utils.AuditTrail.query') as mock_query:
                mock_query.filter_by.side_effect = Exception('Query timeout')
                activity = get_user_activity(1, limit=10)
                # Vérifier que le bloc except retourne une liste vide (ligne 91)
                assert isinstance(activity, list)
                assert len(activity) == 0
    
    def test_search_audit_error(self, app):
        """Test gestion erreur search_audit - lignes 129-131"""
        with app.app_context():
            # Simuler une erreur lors de la construction de la requête
            with patch('audit_utils.AuditTrail.query') as mock_query:
                # Forcer l'erreur dès l'accès à query pour trigger l'exception
                mock_query.filter_by.side_effect = Exception('Invalid query')
                results = search_audit({'user_id': 1}, limit=10)
                # Vérifier que le bloc except retourne une liste vide (ligne 131)
                assert isinstance(results, list)
                assert len(results) == 0

# ============================================
# TESTS MODELS
# ============================================

class TestModels:
    """Tests pour modèles database"""
    
    def test_user_creation(self, app):
        """Test création User"""
        with app.app_context():
            from werkzeug.security import generate_password_hash
            user = User(
                username='newuser',
                email='new@test.com',
                password_hash=generate_password_hash('pass'),
                role='user'
            )
            db.session.add(user)
            db.session.commit()
            
            found = User.query.filter_by(username='newuser').first()
            assert found is not None
    
    def test_dossier_to_dict(self, app, test_dossier):
        """Test méthode to_dict"""
        with app.app_context():
            data = test_dossier.to_dict()
            assert 'numero' in data
            assert data['numero'] == 'D-2026-001'
    
    def test_facture_to_dict(self, app, test_facture):
        """Test facture to_dict"""
        with app.app_context():
            data = test_facture.to_dict()
            assert 'numero' in data
            assert 'montant_ttc' in data
    
    def test_audit_to_dict(self, app, test_user):
        """Test audit to_dict"""
        with app.app_context():
            audit = AuditTrail(
                user_id=test_user.id,
                action='test',
                resource_type='test'
            )
            db.session.add(audit)
            db.session.commit()
            
            data = audit.to_dict()
            assert 'action' in data

# ============================================
# TESTS UTILITIES
# ============================================

class TestUtilities:
    """Tests pour fonctions utilitaires"""
    
    def test_password_hashing(self):
        """Test hashage password"""
        from werkzeug.security import generate_password_hash, check_password_hash
        
        password = 'testpass123'
        hashed = generate_password_hash(password)
        
        assert hashed != password
        assert check_password_hash(hashed, password)
    
    def test_secure_filename(self):
        """Test sécurisation filename"""
        from werkzeug.utils import secure_filename
        
        dangerous = '../../../etc/passwd'
        safe = secure_filename(dangerous)
        assert '../' not in safe
    
    def test_datetime_serialization(self):
        """Test serialization datetime"""
        import json
        
        now = datetime.now()
        # Convertir en string ISO
        iso_string = now.isoformat()
        assert 'T' in iso_string

# ============================================
# TESTS INTEGRATION
# ============================================

class TestIntegration:
    """Tests d'intégration complets"""
    
    def test_full_workflow(self, app, test_user):
        """Test workflow complet CREATE→UPDATE→DELETE"""
        with app.app_context():
            # CREATE
            data = {
                'numero': 'D-WORKFLOW-001',
                'client_nom': 'Workflow Test',
                'type_dossier': 'naturalisation'
            }
            dossier = create_dossier(data, test_user.id)
            assert dossier.id is not None
            
            # UPDATE
            update_result = update_dossier(dossier.id, {'statut': 'en_cours'})
            assert update_result is True
            
            # CREATE FACTURE
            facture_data = {
                'numero': 'F-WORKFLOW-001',
                'dossier_id': dossier.id,
                'client_nom': 'Test',
                'montant_ht': 1000.0,
                'montant_ttc': 1200.0
            }
            facture = create_facture(facture_data)
            assert facture.id is not None
            
            # STATS
            stats = get_dashboard_stats()
            assert stats['total_dossiers'] >= 1
            
            # DELETE
            delete_result = delete_dossier(dossier.id)
            assert delete_result is True

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--cov=db_helpers', '--cov=audit_utils', '--cov-report=term-missing', '--cov-report=html'])
