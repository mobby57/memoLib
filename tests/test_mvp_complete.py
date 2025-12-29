"""
Suite de tests complète pour IA Poste Manager v2.3
Propriété: MS CONSEILS - Sarra Boudjellal
Tests: Unitaires, Intégration, E2E, Performance, Sécurité
"""

import pytest
import asyncio
import json
import time
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from datetime import datetime, timedelta
import tempfile
import os
from typing import Dict, List, Any

# Imports des modules à tester
from backend.services.workspace_manager import WorkspaceManager, Workspace
from backend.ai.intelligent_analyzer import EmailAnalyzer, ResponseGenerator
from backend.security.security_manager import SecurityManager, AuditManager
from backend.config.multi_client_manager import MultiClientManager, ClientConfig
from backend.forms.adaptive_form_generator import AdaptiveFormGenerator, FormValidator

class TestWorkspaceManager:
    """Tests unitaires pour WorkspaceManager"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock de session base de données"""
        session = Mock()
        session.add = Mock()
        session.commit = Mock()
        session.rollback = Mock()
        session.query = Mock()
        return session
    
    @pytest.fixture
    def workspace_manager(self, mock_db_session):
        """Fixture WorkspaceManager avec mocks"""
        return WorkspaceManager(
            db_session=mock_db_session,
            openai_key="test-key-12345",
            encryption_key="test-encryption-key-32-chars-long"
        )
    
    def test_create_workspace_success(self, workspace_manager):
        """Test création workspace avec données valides"""
        email_data = {
            "from": "test@example.com",
            "subject": "Test Subject",
            "content": "Bonjour, j'ai un problème avec ma commande #12345",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        with patch.object(workspace_manager, 'analyze_email_content') as mock_analyze:
            mock_analyze.return_value = {
                "sentiment": 0.2,
                "urgency": "high",
                "category": "support",
                "language": "fr",
                "entities": ["commande", "12345"],
                "complexity": 3
            }
            
            result = workspace_manager.create_workspace(email_data, "test_client", "high")
            
            assert result["status"] == "success"
            assert result["workspace_id"] is not None
            assert result["priority"] == "high"
            assert "analysis" in result
            assert "missing_info" in result
    
    def test_create_workspace_invalid_data(self, workspace_manager):
        """Test création workspace avec données invalides"""
        invalid_data = {"invalid": "data"}
        
        result = workspace_manager.create_workspace(invalid_data, "test_client")
        
        assert result["status"] == "error"
        assert "error_code" in result
        assert result["error_code"] == "WORKSPACE_CREATION_FAILED"
    
    def test_analyze_email_content_success(self, workspace_manager):
        """Test analyse contenu email avec IA"""
        content = "Bonjour, j'ai un problème urgent avec ma commande #12345. Pouvez-vous m'aider rapidement?"
        
        with patch.object(workspace_manager.openai_client.chat.completions, 'create') as mock_openai:
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = json.dumps({
                "sentiment": -0.3,
                "urgency": "high",
                "category": "support",
                "language": "fr",
                "entities": [{"type": "order", "text": "12345", "confidence": 0.9}],
                "complexity": 3,
                "keywords": ["problème", "urgent", "commande"],
                "suggested_response_tone": "apologetic"
            })
            mock_openai.return_value = mock_response
            
            result = workspace_manager.analyze_email_content(content)
            
            assert result["sentiment"] == -0.3
            assert result["urgency"] == "high"
            assert result["category"] == "support"
            assert result["language"] == "fr"
            assert len(result["entities"]) > 0
    
    def test_analyze_email_content_fallback(self, workspace_manager):
        """Test fallback en cas d'erreur IA"""
        content = "Test content"
        
        with patch.object(workspace_manager.openai_client.chat.completions, 'create') as mock_openai:
            mock_openai.side_effect = Exception("API Error")
            
            result = workspace_manager.analyze_email_content(content)
            
            assert result["fallback"] == True
            assert result["sentiment"] == 0.0
            assert result["urgency"] == "normal"
            assert result["category"] == "info"
    
    def test_detect_missing_info_support(self, workspace_manager):
        """Test détection informations manquantes pour support"""
        analysis_result = {
            "category": "support",
            "urgency": "high"
        }
        email_data = {
            "content": "J'ai un problème",
            "from": "user@example.com"
        }
        
        missing_info = workspace_manager.detect_missing_info(analysis_result, email_data)
        
        assert len(missing_info) > 0
        field_names = [info['field'] for info in missing_info]
        assert 'order_id' in field_names or 'problem_description' in field_names
    
    def test_generate_adaptive_form(self, workspace_manager):
        """Test génération formulaire adaptatif"""
        missing_info = [
            {
                'field': 'order_id',
                'label': 'Numéro de commande',
                'type': 'text',
                'required': True,
                'suggestion': 'Ex: CMD-2024-001234'
            }
        ]
        client_config = {
            'accessibility': {'high_contrast': True}
        }
        
        form_schema = workspace_manager.generate_adaptive_form(missing_info, client_config)
        
        assert form_schema["form_id"] is not None
        assert len(form_schema["fields"]) > 0
        assert form_schema["accessibility"]["screen_reader_support"] == True
        assert form_schema["accessibility"]["high_contrast"] == True
    
    def test_simulate_human_questions(self, workspace_manager):
        """Test simulation questions humaines"""
        email_content = "J'ai un problème avec ma commande"
        context = {"category": "support"}
        
        with patch.object(workspace_manager.openai_client.chat.completions, 'create') as mock_openai:
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = json.dumps([
                "Quel est le numéro de votre commande?",
                "Pouvez-vous décrire le problème en détail?",
                "Quand avez-vous passé cette commande?"
            ])
            mock_openai.return_value = mock_response
            
            questions = workspace_manager.simulate_human_questions(email_content, context)
            
            assert isinstance(questions, list)
            assert len(questions) > 0
            assert all(isinstance(q, str) for q in questions)
    
    def test_generate_ai_response(self, workspace_manager):
        """Test génération réponse IA"""
        email_data = {
            "content": "Bonjour, j'ai un problème avec ma commande",
            "analysis": {
                "category": "support",
                "urgency": "normal",
                "language": "fr"
            }
        }
        
        with patch.object(workspace_manager.openai_client.chat.completions, 'create') as mock_openai:
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = "Bonjour, merci pour votre message. Nous allons examiner votre problème et revenir vers vous rapidement. Cordialement, L'équipe Support"
            mock_openai.return_value = mock_response
            
            result = workspace_manager.generate_ai_response(email_data, "professional", "fr")
            
            assert "response_text" in result
            assert result["language"] == "fr"
            assert result["tone"] == "professional"
            assert len(result["response_text"]) > 50
    
    @pytest.mark.asyncio
    async def test_concurrent_workspace_creation(self, workspace_manager):
        """Test création simultanée de workspaces"""
        async def create_workspace_async(i):
            email_data = {
                "from": f"test{i}@example.com",
                "subject": f"Test {i}",
                "content": f"Content {i}",
                "timestamp": datetime.utcnow().isoformat()
            }
            return workspace_manager.create_workspace(email_data, "test_client")
        
        with patch.object(workspace_manager, 'analyze_email_content') as mock_analyze:
            mock_analyze.return_value = {
                "sentiment": 0.0,
                "urgency": "normal",
                "category": "info",
                "language": "fr"
            }
            
            tasks = [create_workspace_async(i) for i in range(5)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            successful_results = [r for r in results if isinstance(r, dict) and r.get("status") == "success"]
            assert len(successful_results) == 5

class TestEmailAnalyzer:
    """Tests pour EmailAnalyzer"""
    
    @pytest.fixture
    def email_analyzer(self):
        """Fixture EmailAnalyzer"""
        return EmailAnalyzer(openai_key="test-key", model="gpt-4")
    
    def test_analyze_content_complete(self, email_analyzer):
        """Test analyse complète de contenu"""
        email_text = "Bonjour, j'ai un problème urgent avec ma commande #CMD-2024-001. Mon email est john@example.com et mon téléphone 0123456789."
        
        with patch.object(email_analyzer, '_ai_analysis') as mock_ai:
            mock_ai.return_value = {
                "sentiment": -0.4,
                "urgency": "high",
                "category": "support",
                "language": "fr",
                "complexity": 3
            }
            
            with patch.object(email_analyzer, '_extract_entities') as mock_entities:
                mock_entities.return_value = {
                    "entities": [
                        {"text": "john@example.com", "label": "EMAIL", "confidence": 0.9},
                        {"text": "0123456789", "label": "PHONE", "confidence": 0.9}
                    ],
                    "entity_count": 2
                }
                
                result = email_analyzer.analyze_content(email_text)
                
                assert result["sentiment"] == -0.4
                assert result["urgency"] == "high"
                assert result["category"] == "support"
                assert result["entity_count"] == 2
                assert "confidence_score" in result
                assert "processing_time" in result
    
    def test_local_analysis(self, email_analyzer):
        """Test analyse locale sans IA"""
        content = "Urgent! Problème avec commande CMD-123. Contact: test@example.com"
        
        result = email_analyzer._local_analysis(content)
        
        assert result["word_count"] > 0
        assert result["char_count"] > 0
        assert result["local_urgency"] in ["low", "normal", "high", "critical"]
        assert result["local_category"] in ["support", "commercial", "complaint", "request", "info"]
    
    def test_cache_functionality(self, email_analyzer):
        """Test fonctionnalité de cache"""
        email_text = "Test email content for caching"
        
        with patch.object(email_analyzer, '_ai_analysis') as mock_ai:
            mock_ai.return_value = {"test": "result"}
            
            # Premier appel
            result1 = email_analyzer.analyze_content(email_text)
            
            # Deuxième appel (devrait utiliser le cache)
            result2 = email_analyzer.analyze_content(email_text)
            
            # L'IA ne devrait être appelée qu'une fois
            assert mock_ai.call_count == 1
            assert result1 == result2

class TestSecurityManager:
    """Tests pour SecurityManager"""
    
    @pytest.fixture
    def security_manager(self):
        """Fixture SecurityManager"""
        return SecurityManager("test-master-key-32-characters")
    
    def test_encrypt_decrypt_cycle(self, security_manager):
        """Test cycle complet chiffrement/déchiffrement"""
        original_data = "Données sensibles à protéger: john.doe@example.com, 0123456789"
        
        encrypted = security_manager.encrypt_sensitive_data(original_data, "test_context")
        decrypted = security_manager.decrypt_sensitive_data(encrypted, "test_context")
        
        assert decrypted == original_data
        assert encrypted != original_data
        assert len(encrypted) > len(original_data)  # Chiffrement ajoute des données
    
    def test_anonymize_email_data(self, security_manager):
        """Test anonymisation données email RGPD"""
        email_data = {
            "from": "john.doe@example.com",
            "to": ["jane.smith@example.com", "bob@company.com"],
            "cc": ["manager@company.com"],
            "subject": "Commande urgente",
            "content": "Bonjour John Doe, voici mon numéro: 01.23.45.67.89 et mon email personnel: personal@gmail.com"
        }
        
        anonymized = security_manager.anonymize_email_data(email_data)
        
        # Vérifier que les emails sont anonymisés
        assert "@" not in anonymized["from"]
        assert all("@" not in email for email in anonymized["to"])
        assert all("@" not in email for email in anonymized["cc"])
        
        # Vérifier que le contenu est anonymisé
        assert "[EMAIL]" in anonymized["content"]
        assert "[PHONE]" in anonymized["content"]
        assert "john.doe" not in anonymized["content"].lower()
        
        # Vérifier les métadonnées d'anonymisation
        assert anonymized["_anonymized"] == True
        assert "_anonymized_at" in anonymized
    
    def test_password_validation_strong(self, security_manager):
        """Test validation mot de passe fort"""
        strong_password = "MyStr0ng!P@ssw0rd2024"
        
        result = security_manager.validate_password(strong_password)
        
        assert result["is_valid"] == True
        assert result["score"] >= 80
        assert len(result["errors"]) == 0
    
    def test_password_validation_weak(self, security_manager):
        """Test validation mot de passe faible"""
        weak_password = "123456"
        
        result = security_manager.validate_password(weak_password)
        
        assert result["is_valid"] == False
        assert result["score"] < 50
        assert len(result["errors"]) > 0
    
    def test_rate_limiting(self, security_manager):
        """Test rate limiting"""
        identifier = "test_user"
        action = "login"
        limit = 3
        window = 60
        
        # Premières tentatives dans la limite
        for i in range(limit):
            assert security_manager.check_rate_limit(identifier, action, limit, window) == True
        
        # Tentative supplémentaire qui dépasse la limite
        assert security_manager.check_rate_limit(identifier, action, limit, window) == False
    
    def test_suspicious_activity_detection(self, security_manager):
        """Test détection activité suspecte"""
        activity_data = {
            "ip_address": "192.168.1.100",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "timestamp": datetime.utcnow().replace(hour=3)  # 3h du matin
        }
        
        result = security_manager.detect_suspicious_activity("test_user", activity_data)
        
        assert "risk_score" in result
        assert "risk_level" in result
        assert "alerts" in result
        assert "recommended_actions" in result
        assert result["risk_level"] in ["NONE", "LOW", "MEDIUM", "HIGH"]
    
    def test_hash_verify_password(self, security_manager):
        """Test hash et vérification mot de passe"""
        password = "TestPassword123!"
        
        hashed = security_manager.hash_password(password)
        
        # Vérification avec bon mot de passe
        assert security_manager.verify_password(password, hashed) == True
        
        # Vérification avec mauvais mot de passe
        assert security_manager.verify_password("WrongPassword", hashed) == False

class TestMultiClientManager:
    """Tests pour MultiClientManager"""
    
    @pytest.fixture
    def temp_config_dir(self):
        """Répertoire temporaire pour les configs"""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield temp_dir
    
    @pytest.fixture
    def multi_client_manager(self, temp_config_dir):
        """Fixture MultiClientManager"""
        return MultiClientManager(
            config_path=temp_config_dir,
            encryption_key="test-encryption-key-32-characters"
        )
    
    def test_create_default_config(self, multi_client_manager):
        """Test création configuration par défaut"""
        config = multi_client_manager.create_default_config("test_client", "Test Client")
        
        assert config.client_id == "test_client"
        assert config.name == "Test Client"
        assert "email_settings" in asdict(config)
        assert "ai_settings" in asdict(config)
        assert "security_settings" in asdict(config)
    
    def test_save_load_client_config(self, multi_client_manager):
        """Test sauvegarde et chargement configuration"""
        config = multi_client_manager.create_default_config("test_client", "Test Client")
        
        # Sauvegarde
        assert multi_client_manager.save_client_config(config) == True
        
        # Chargement
        loaded_config = multi_client_manager.load_client_config("test_client")
        
        assert loaded_config is not None
        assert loaded_config.client_id == "test_client"
        assert loaded_config.name == "Test Client"
    
    def test_update_client_setting(self, multi_client_manager):
        """Test mise à jour paramètre client"""
        config = multi_client_manager.create_default_config("test_client", "Test Client")
        multi_client_manager.save_client_config(config)
        
        # Mise à jour d'un paramètre
        success = multi_client_manager.update_client_setting(
            "test_client", 
            "ai_settings.temperature", 
            0.9
        )
        
        assert success == True
        
        # Vérification de la mise à jour
        updated_config = multi_client_manager.get_client_config("test_client")
        assert updated_config.ai_settings["temperature"] == 0.9
    
    def test_validate_config(self, multi_client_manager):
        """Test validation configuration"""
        # Configuration valide
        valid_config = multi_client_manager.create_default_config("test_client", "Test Client")
        errors = multi_client_manager.validate_config(valid_config)
        assert len(errors) == 0
        
        # Configuration invalide
        invalid_config = ClientConfig(
            client_id="",  # ID vide
            name="",       # Nom vide
            email_settings={},
            ai_settings={"temperature": 5.0},  # Température invalide
            form_settings={},
            security_settings={},
            accessibility_settings={},
            notification_settings={},
            branding={"primary_color": "invalid_color"}  # Couleur invalide
        )
        
        errors = multi_client_manager.validate_config(invalid_config)
        assert len(errors) > 0
        assert "client_id" in errors
        assert "name" in errors

class TestAdaptiveFormGenerator:
    """Tests pour AdaptiveFormGenerator"""
    
    @pytest.fixture
    def form_generator(self):
        """Fixture AdaptiveFormGenerator"""
        client_config = {
            "accessibility": {"high_contrast": True},
            "form_customization": {}
        }
        return AdaptiveFormGenerator(client_config)
    
    def test_generate_form_schema(self, form_generator):
        """Test génération schéma de formulaire"""
        missing_info = [
            {
                'field': 'order_id',
                'label': 'Numéro de commande',
                'type': 'text',
                'required': True,
                'suggestion': 'Ex: CMD-2024-001234'
            },
            {
                'field': 'problem_description',
                'label': 'Description du problème',
                'type': 'textarea',
                'required': True,
                'suggestion': 'Décrivez votre problème en détail'
            }
        ]
        
        email_context = {
            "category": "support",
            "urgency": "high"
        }
        
        schema = form_generator.generate_form_schema(missing_info, email_context)
        
        assert "form_id" in schema
        assert "fields" in schema
        assert len(schema["fields"]) >= len(missing_info)  # Peut avoir des champs contextuels
        assert schema["accessibility"]["screen_reader_support"] == True
        assert "🚨 URGENT" in schema["title"] or "⚡ PRIORITAIRE" in schema["title"]

class TestFormValidator:
    """Tests pour FormValidator"""
    
    @pytest.fixture
    def form_validator(self):
        """Fixture FormValidator"""
        return FormValidator()
    
    def test_validate_form_data_success(self, form_validator):
        """Test validation données formulaire valides"""
        form_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "0123456789",
            "message": "Ceci est un message de test suffisamment long"
        }
        
        form_schema = {
            "fields": [
                {"id": "name", "type": "text", "required": True},
                {"id": "email", "type": "email", "required": True},
                {"id": "phone", "type": "text", "required": False},
                {"id": "message", "type": "textarea", "required": True}
            ],
            "validation_rules": {
                "email": {"type": "email", "message": "Email invalide"},
                "message": {"minLength": 10, "message": "Message trop court"}
            }
        }
        
        result = form_validator.validate_form_data(form_data, form_schema)
        
        assert result["is_valid"] == True
        assert len(result["errors"]) == 0
        assert "cleaned_data" in result
    
    def test_validate_form_data_errors(self, form_validator):
        """Test validation données formulaire avec erreurs"""
        form_data = {
            "name": "",  # Champ requis vide
            "email": "invalid-email",  # Email invalide
            "message": "Court"  # Message trop court
        }
        
        form_schema = {
            "fields": [
                {"id": "name", "type": "text", "required": True, "label": "Nom"},
                {"id": "email", "type": "email", "required": True, "label": "Email"},
                {"id": "message", "type": "textarea", "required": True, "label": "Message"}
            ],
            "validation_rules": {
                "email": {"type": "email", "message": "Email invalide"},
                "message": {"minLength": 10, "message": "Message trop court"}
            }
        }
        
        result = form_validator.validate_form_data(form_data, form_schema)
        
        assert result["is_valid"] == False
        assert len(result["errors"]) >= 3
        assert "name" in result["errors"]
        assert "email" in result["errors"]
        assert "message" in result["errors"]

class TestIntegration:
    """Tests d'intégration entre modules"""
    
    @pytest.fixture
    def integrated_system(self):
        """Système intégré pour tests"""
        # Mock des dépendances
        mock_db = Mock()
        
        # Création des managers
        workspace_manager = WorkspaceManager(
            db_session=mock_db,
            openai_key="test-key",
            encryption_key="test-encryption-key-32-characters"
        )
        
        security_manager = SecurityManager("test-master-key-32-characters")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            multi_client_manager = MultiClientManager(
                config_path=temp_dir,
                encryption_key="test-encryption-key-32-characters"
            )
            
            yield {
                "workspace_manager": workspace_manager,
                "security_manager": security_manager,
                "multi_client_manager": multi_client_manager
            }
    
    def test_end_to_end_workflow(self, integrated_system):
        """Test workflow complet de bout en bout"""
        workspace_mgr = integrated_system["workspace_manager"]
        security_mgr = integrated_system["security_manager"]
        client_mgr = integrated_system["multi_client_manager"]
        
        # 1. Créer configuration client
        client_config = client_mgr.create_default_config("test_client", "Test Client")
        assert client_mgr.save_client_config(client_config) == True
        
        # 2. Chiffrer données sensibles
        sensitive_email = "user@example.com"
        encrypted_email = security_mgr.encrypt_sensitive_data(sensitive_email, "email_data")
        assert encrypted_email != sensitive_email
        
        # 3. Créer workspace avec email chiffré
        email_data = {
            "from": encrypted_email,
            "subject": "Test Subject",
            "content": "Test content for integration",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        with patch.object(workspace_mgr, 'analyze_email_content') as mock_analyze:
            mock_analyze.return_value = {
                "sentiment": 0.0,
                "urgency": "normal",
                "category": "info",
                "language": "fr"
            }
            
            result = workspace_mgr.create_workspace(email_data, "test_client")
            assert result["status"] == "success"
        
        # 4. Déchiffrer et vérifier
        decrypted_email = security_mgr.decrypt_sensitive_data(encrypted_email, "email_data")
        assert decrypted_email == sensitive_email

class TestPerformance:
    """Tests de performance"""
    
    def test_workspace_creation_performance(self):
        """Test performance création workspace"""
        mock_db = Mock()
        workspace_manager = WorkspaceManager(
            db_session=mock_db,
            openai_key="test-key",
            encryption_key="test-encryption-key-32-characters"
        )
        
        email_data = {
            "from": "test@example.com",
            "subject": "Performance Test",
            "content": "Test content for performance measurement",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        with patch.object(workspace_manager, 'analyze_email_content') as mock_analyze:
            mock_analyze.return_value = {
                "sentiment": 0.0,
                "urgency": "normal",
                "category": "info",
                "language": "fr"
            }
            
            start_time = time.time()
            
            # Créer 10 workspaces
            for i in range(10):
                result = workspace_manager.create_workspace(email_data, f"client_{i}")
                assert result["status"] == "success"
            
            end_time = time.time()
            total_time = end_time - start_time
            
            # Vérifier que ça prend moins de 5 secondes pour 10 créations
            assert total_time < 5.0
            
            # Temps moyen par création
            avg_time = total_time / 10
            assert avg_time < 0.5  # Moins de 500ms par création
    
    def test_encryption_performance(self):
        """Test performance chiffrement"""
        security_manager = SecurityManager("test-master-key-32-characters")
        
        # Données de test de différentes tailles
        test_data = [
            "Small data",
            "Medium data " * 100,
            "Large data " * 1000
        ]
        
        for data in test_data:
            start_time = time.time()
            
            # Chiffrement
            encrypted = security_manager.encrypt_sensitive_data(data, "performance_test")
            
            # Déchiffrement
            decrypted = security_manager.decrypt_sensitive_data(encrypted, "performance_test")
            
            end_time = time.time()
            
            # Vérifier que le cycle complet prend moins de 100ms
            assert (end_time - start_time) < 0.1
            assert decrypted == data

class TestSecurity:
    """Tests de sécurité"""
    
    def test_sql_injection_protection(self):
        """Test protection contre injection SQL"""
        # Ce test vérifierait que les requêtes SQL sont paramétrées
        # et protégées contre les injections
        pass
    
    def test_xss_protection(self):
        """Test protection contre XSS"""
        # Ce test vérifierait que les données utilisateur sont échappées
        pass
    
    def test_csrf_protection(self):
        """Test protection contre CSRF"""
        # Ce test vérifierait la présence de tokens CSRF
        pass
    
    def test_data_encryption_at_rest(self):
        """Test chiffrement des données au repos"""
        security_manager = SecurityManager("test-master-key-32-characters")
        
        sensitive_data = "Données confidentielles"
        encrypted = security_manager.encrypt_sensitive_data(sensitive_data, "test")
        
        # Vérifier que les données chiffrées ne contiennent pas le texte original
        assert sensitive_data not in encrypted
        assert len(encrypted) > len(sensitive_data)
    
    def test_audit_trail_completeness(self):
        """Test complétude de l'audit trail"""
        security_manager = SecurityManager("test-master-key-32-characters")
        
        # Effectuer des opérations qui doivent être auditées
        security_manager.encrypt_sensitive_data("test data", "audit_test")
        security_manager.decrypt_sensitive_data(
            security_manager.encrypt_sensitive_data("test data", "audit_test"),
            "audit_test"
        )
        
        # Vérifier que les événements sont loggés
        # (En production, on vérifierait les fichiers de log)

# Configuration Pytest
@pytest.fixture(scope="session")
def event_loop():
    """Fixture pour les tests asyncio"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Markers pour catégoriser les tests
pytestmark = [
    pytest.mark.unit,
    pytest.mark.integration,
    pytest.mark.performance,
    pytest.mark.security
]

if __name__ == "__main__":
    # Exécution des tests avec options par défaut
    pytest.main([
        "-v",                    # Verbose
        "--tb=short",           # Traceback court
        "--cov=backend",        # Couverture de code
        "--cov-report=html",    # Rapport HTML
        "--cov-report=term",    # Rapport terminal
        "--durations=10",       # Top 10 des tests les plus lents
        "--maxfail=5"           # Arrêter après 5 échecs
    ])