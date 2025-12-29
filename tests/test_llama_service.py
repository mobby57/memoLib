"""
Tests pour Llama Service - Alternative gratuite à OpenAI
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from src.services.llama_service import LlamaService, llama_service


class TestLlamaService:
    """Tests du service Llama 3.1 local"""
    
    @pytest.fixture
    def service(self):
        """Fixture service Llama"""
        return LlamaService()
    
    def test_service_initialization(self, service):
        """Test initialisation du service"""
        assert service.base_url == 'http://localhost:11434'
        assert service.model == 'llama3.1:8b'
        assert service.timeout == 30
    
    def test_custom_configuration(self, monkeypatch):
        """Test configuration personnalisée"""
        monkeypatch.setenv('OLLAMA_BASE_URL', 'http://custom:8080')
        monkeypatch.setenv('LLAMA_MODEL', 'llama3.1:70b')
        monkeypatch.setenv('LLAMA_TIMEOUT', '60')
        
        service = LlamaService()
        assert service.base_url == 'http://custom:8080'
        assert service.model == 'llama3.1:70b'
        assert service.timeout == 60
    
    @patch('requests.get')
    def test_is_available_success(self, mock_get, service):
        """Test vérification disponibilité - succès"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        assert service.is_available() is True
        mock_get.assert_called_once()
    
    @patch('requests.get')
    def test_is_available_failure(self, mock_get, service):
        """Test vérification disponibilité - échec"""
        mock_get.side_effect = Exception("Connection refused")
        
        assert service.is_available() is False
    
    @patch('requests.get')
    def test_list_models(self, mock_get, service):
        """Test listage des modèles"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'models': [
                {'name': 'llama3.1:8b'},
                {'name': 'llama3.1:70b'},
                {'name': 'llama3.2:3b'}
            ]
        }
        mock_get.return_value = mock_response
        
        models = service.list_models()
        assert len(models) == 3
        assert 'llama3.1:8b' in models
        assert 'llama3.1:70b' in models
    
    @patch('requests.post')
    def test_generate_email_success(self, mock_post, service):
        """Test génération email - succès"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'response': 'Objet: Demande de congés\n\nMadame, Monsieur,\n\nJe souhaite...'
        }
        mock_post.return_value = mock_response
        
        email = service.generate_email(
            context="Demande de congés",
            tone="professionnel"
        )
        
        assert email is not None
        assert 'Objet:' in email or 'congés' in email.lower()
        mock_post.assert_called_once()
    
    @patch('requests.post')
    def test_generate_email_failure(self, mock_post, service):
        """Test génération email - échec"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal server error"
        mock_post.return_value = mock_response
        
        email = service.generate_email("test")
        assert email is None
    
    @patch('requests.post')
    def test_generate_email_with_custom_params(self, mock_post, service):
        """Test génération avec paramètres personnalisés"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'response': 'Email généré'}
        mock_post.return_value = mock_response
        
        service.generate_email(
            context="Réunion importante",
            tone="urgent",
            max_tokens=300
        )
        
        # Vérifier que max_tokens est passé
        call_args = mock_post.call_args[1]['json']
        assert call_args['options']['num_predict'] == 300
    
    def test_build_prompt_professional(self, service):
        """Test construction prompt ton professionnel"""
        prompt = service._build_prompt("Demande de congés", "professionnel")
        
        assert "Contexte: Demande de congés" in prompt
        assert "professionnel" in prompt.lower()
        assert "email" in prompt.lower()
    
    def test_build_prompt_formal(self, service):
        """Test construction prompt ton formel"""
        prompt = service._build_prompt("Réclamation", "formel")
        
        assert "formel" in prompt.lower()
        assert "vouvoiement" in prompt.lower()
    
    def test_clean_response_with_markdown(self, service):
        """Test nettoyage réponse avec markdown"""
        response = "```\nObjet: Test\n\nCorps email\n```"
        cleaned = service._clean_response(response)
        
        assert not cleaned.startswith('```')
        assert not cleaned.endswith('```')
    
    def test_clean_response_simple(self, service):
        """Test nettoyage réponse simple"""
        response = "  Objet: Test\n\nCorps  "
        cleaned = service._clean_response(response)
        
        assert cleaned == "Objet: Test\n\nCorps"
    
    @patch('requests.post')
    def test_generate_email_streaming(self, mock_post, service):
        """Test génération en mode streaming"""
        mock_response = Mock()
        mock_response.iter_lines.return_value = [
            b'{"response": "Objet: "}',
            b'{"response": "Test"}',
            b'{"response": "\\n\\nCorps"}'
        ]
        mock_post.return_value = mock_response
        
        chunks = list(service.generate_email_streaming("Test"))
        
        assert len(chunks) == 3
        assert chunks[0] == "Objet: "
        assert chunks[1] == "Test"
    
    @patch('requests.post')
    def test_get_model_info(self, mock_post, service):
        """Test récupération infos modèle"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'modelfile': 'FROM llama3.1',
            'parameters': 'temperature 0.7',
            'template': '...'
        }
        mock_post.return_value = mock_response
        
        info = service.get_model_info()
        assert info is not None
        assert 'modelfile' in info or 'parameters' in info or len(info) == 0
    
    @patch('requests.post')
    def test_pull_model_success(self, mock_post, service, capsys):
        """Test téléchargement modèle - succès"""
        mock_response = Mock()
        mock_response.iter_lines.return_value = [
            b'{"status": "downloading"}',
            b'{"status": "completed"}'
        ]
        mock_post.return_value = mock_response
        
        result = service.pull_model('llama3.1:8b')
        
        assert result is True
        captured = capsys.readouterr()
        assert 'Téléchargement' in captured.out
    
    @patch('requests.post')
    def test_pull_model_failure(self, mock_post, service):
        """Test téléchargement modèle - échec"""
        mock_post.side_effect = Exception("Network error")
        
        result = service.pull_model()
        assert result is False


class TestLlamaServiceIntegration:
    """Tests d'intégration (nécessitent Ollama actif)"""
    
    @pytest.mark.integration
    def test_real_availability_check(self):
        """Test réel de disponibilité"""
        service = LlamaService()
        # Ne devrait pas lever d'exception
        is_available = service.is_available()
        assert isinstance(is_available, bool)
    
    @pytest.mark.integration
    @pytest.mark.skipif(not llama_service.is_available(), reason="Ollama non disponible")
    def test_real_model_list(self):
        """Test réel listage modèles"""
        models = llama_service.list_models()
        assert isinstance(models, list)
    
    @pytest.mark.integration
    @pytest.mark.skipif(not llama_service.is_available(), reason="Ollama non disponible")
    def test_real_email_generation(self):
        """Test réel génération email"""
        email = llama_service.generate_email(
            context="Test automatique",
            tone="professionnel",
            max_tokens=200
        )
        
        if email:  # Si Ollama disponible
            assert len(email) > 10
            # Devrait contenir des mots clés email
            assert any(word in email.lower() for word in ['objet', 'madame', 'monsieur', 'cordialement'])


class TestLlamaServiceCache:
    """Tests du système de cache LRU"""
    
    @patch('requests.post')
    def test_cache_hit(self, mock_post):
        """Test cache hit - même requête"""
        service = LlamaService()
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'response': 'Email 1'}
        mock_post.return_value = mock_response
        
        # Première requête
        email1 = service.generate_email("Test cache", "professionnel")
        
        # Deuxième requête identique
        email2 = service.generate_email("Test cache", "professionnel")
        
        # Devrait être en cache, donc même résultat
        assert email1 == email2
        
        # Mais seulement 1 appel API (cache)
        assert mock_post.call_count == 1
    
    @patch('requests.post')
    def test_cache_miss(self, mock_post):
        """Test cache miss - requêtes différentes"""
        service = LlamaService()
        mock_response1 = Mock()
        mock_response1.status_code = 200
        mock_response1.json.return_value = {'response': 'Email 1'}
        
        mock_response2 = Mock()
        mock_response2.status_code = 200
        mock_response2.json.return_value = {'response': 'Email 2'}
        
        mock_post.side_effect = [mock_response1, mock_response2]
        
        # Requêtes différentes
        email1 = service.generate_email("Contexte A", "professionnel")
        email2 = service.generate_email("Contexte B", "professionnel")
        
        # Devrait générer 2 appels API différents
        assert mock_post.call_count == 2
        assert email1 != email2


class TestGlobalInstance:
    """Tests de l'instance globale"""
    
    def test_global_instance_exists(self):
        """Test instance globale existe"""
        from src.services.llama_service import llama_service
        assert llama_service is not None
        assert isinstance(llama_service, LlamaService)
    
    @patch('requests.get')
    def test_global_instance_is_available(self, mock_get):
        """Test méthode is_available de l'instance globale"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        from src.services.llama_service import llama_service
        assert llama_service.is_available() is True


if __name__ == "__main__":
    # Lancer tests
    pytest.main([__file__, '-v', '--tb=short'])
