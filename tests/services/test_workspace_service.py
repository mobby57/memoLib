"""
Tests complets pour WorkspaceService

Tests couvrent:
- Création de workspaces
- Traitement d'actions
- Intégration avec tous les services
- Gestion d'erreurs et edge cases
- Support multi-langue et accessibilité
- Métriques et logging
"""

import pytest
import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from src.backend.services.workspace_service import (
    WorkspaceService,
    WorkspaceType,
    WorkspacePriority,
    WorkspaceStatus
)


class TestWorkspaceService:
    """Tests pour WorkspaceService"""

    @pytest.fixture
    def workspace_service(self):
        """Fixture pour WorkspaceService"""
        service = WorkspaceService()

        # Mock des services dépendants
        service.human_thought_sim = AsyncMock()
        service.responder = AsyncMock()
        service.form_generator = AsyncMock()
        service.security = AsyncMock()
        service.ai_service = AsyncMock()
        service.logger = AsyncMock()

        return service

    @pytest.fixture
    def sample_email(self):
        """Fixture pour un email d'exemple"""
        return {
            'subject': 'Demande MDPH - Reconnaissance handicap',
            'content': 'Bonjour, je souhaite faire une demande de reconnaissance de handicap...',
            'sender': 'user@example.com'
        }

    @pytest.fixture
    def sample_analysis(self):
        """Fixture pour une analyse IA d'exemple"""
        return {
            'complexity_score': 7.5,
            'priority': 'high',
            'missing_info': ['date_naissance', 'adresse'],
            'suggested_actions': ['generate_form', 'generate_response'],
            'response_type': 'request_info',
            'needs_form': True,
            'keywords': ['MDPH', 'handicap', 'demande'],
            'sentiment': 'neutral',
            'confidentiality_level': 'high'
        }

    @pytest.mark.asyncio
    async def test_create_workspace_success(self, workspace_service, sample_email, sample_analysis):
        """Test création workspace réussie"""
        # Mock l'analyse IA
        workspace_service.ai_service.analyze_smart.return_value = sample_analysis
        workspace_service.logger.log_workspace_event.return_value = "log_id_123"

        # Créer workspace
        workspace = await workspace_service.create_workspace(
            email_content=sample_email['content'],
            email_subject=sample_email['subject'],
            email_sender=sample_email['sender'],
            workspace_type=WorkspaceType.MDPH,
            user_id="user_123",
            user_plan="PREMIUM",
            language="fr"
        )

        # Vérifications
        assert workspace['id'] is not None
        assert workspace['type'] == 'mdph'
        assert workspace['status'] == 'created'
        assert workspace['user_id'] == "user_123"
        assert workspace['user_plan'] == "PREMIUM"
        assert workspace['language'] == "fr"
        assert workspace['email']['subject'] == sample_email['subject']
        assert workspace['analysis'] == sample_analysis
        assert len(workspace['history']) == 1
        assert workspace['metrics']['ai_calls_count'] == 1

        # Vérifier appels aux mocks
        workspace_service.ai_service.analyze_smart.assert_called_once()
        workspace_service.logger.log_workspace_event.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_workspace_with_accessibility(self, workspace_service, sample_email, sample_analysis):
        """Test création workspace avec mode accessibilité"""
        workspace_service.ai_service.analyze_smart.return_value = sample_analysis
        workspace_service.logger.log_workspace_event.return_value = "log_id_123"

        workspace = await workspace_service.create_workspace(
            email_content=sample_email['content'],
            email_subject=sample_email['subject'],
            email_sender=sample_email['sender'],
            accessibility_mode="malvoyant"
        )

        assert workspace['accessibility_mode'] == "malvoyant"

    @pytest.mark.asyncio
    async def test_process_workspace_generate_response(self, workspace_service, sample_email, sample_analysis):
        """Test traitement action generate_response"""
        # Setup workspace existant
        workspace_id = str(uuid.uuid4())
        workspace = {
            'id': workspace_id,
            'type': 'mdph',
            'status': 'created',
            'email': sample_email,
            'analysis': sample_analysis,
            'user_plan': 'PREMIUM',
            'language': 'fr',
            'history': [],
            'metrics': {'processing_time_seconds': 0, 'ai_calls_count': 0, 'complexity_score': 5.0}
        }
        workspace_service.active_workspaces[workspace_id] = workspace

        # Mock réponse
        mock_response = {
            'content': 'Réponse générée automatiquement',
            'tone': 'professional',
            'language': 'fr'
        }
        workspace_service.responder.generate_response.return_value = mock_response
        workspace_service.logger.log_workspace_event.return_value = "log_id_456"

        # Traiter action
        result = await workspace_service.process_workspace(
            workspace_id=workspace_id,
            action='generate_response',
            parameters={'tone': 'professional'}
        )

        # Vérifications
        assert result['status'] == 'response_generated'
        assert result['response'] == mock_response
        assert workspace['generated_response'] == mock_response
        assert workspace['status'] == 'completed'
        assert len(workspace['history']) == 1
        assert workspace['metrics']['ai_calls_count'] == 1

        # Vérifier appel au responder
        workspace_service.responder.generate_response.assert_called_once_with(
            email_content=sample_email['content'],
            email_subject=sample_email['subject'],
            workspace_analysis=sample_analysis,
            tone='professional',
            language='fr',
            user_plan='PREMIUM'
        )

    @pytest.mark.asyncio
    async def test_process_workspace_generate_form(self, workspace_service, sample_email, sample_analysis):
        """Test traitement action generate_form"""
        # Setup workspace
        workspace_id = str(uuid.uuid4())
        workspace = {
            'id': workspace_id,
            'type': 'mdph',
            'status': 'created',
            'email': sample_email,
            'analysis': sample_analysis,
            'missing_info': ['nom', 'prenom'],
            'user_plan': 'PREMIUM',
            'language': 'fr',
            'accessibility_mode': None,
            'history': [],
            'metrics': {'processing_time_seconds': 0, 'ai_calls_count': 0, 'complexity_score': 5.0}
        }
        workspace_service.active_workspaces[workspace_id] = workspace

        # Mock questions et formulaire
        mock_questions = [
            {'question': 'Quel est votre nom?', 'field_type': 'text', 'priority': 'high'},
            {'question': 'Quel est votre prénom?', 'field_type': 'text', 'priority': 'high'}
        ]
        mock_form = {
            'id': 'form_123',
            'type': 'mdph',
            'steps': [{'title': 'Informations', 'fields': []}]
        }

        workspace_service.human_thought_sim.generate_questions.return_value = mock_questions
        workspace_service.form_generator.generate_form.return_value = mock_form
        workspace_service.logger.log_workspace_event.return_value = "log_id_789"

        # Traiter action
        result = await workspace_service.process_workspace(
            workspace_id=workspace_id,
            action='generate_form'
        )

        # Vérifications
        assert result['status'] == 'form_generated'
        assert result['form'] == mock_form
        assert workspace['generated_form'] == mock_form
        assert workspace['status'] == 'waiting_info'
        assert workspace['metrics']['ai_calls_count'] == 1

        # Vérifier appels aux mocks
        workspace_service.human_thought_sim.generate_questions.assert_called_once()
        workspace_service.form_generator.generate_form.assert_called_once_with(
            questions=mock_questions,
            form_type='mdph',
            accessibility_mode=None,
            language='fr',
            user_data=None
        )

    @pytest.mark.asyncio
    async def test_process_workspace_request_missing_info(self, workspace_service, sample_email, sample_analysis):
        """Test traitement action request_missing_info"""
        workspace_id = str(uuid.uuid4())
        workspace = {
            'id': workspace_id,
            'type': 'general',
            'status': 'created',
            'email': sample_email,
            'analysis': sample_analysis,
            'missing_info': ['telephone', 'email'],
            'user_plan': 'FREE',
            'language': 'fr',
            'history': [],
            'metrics': {'processing_time_seconds': 0, 'ai_calls_count': 0, 'complexity_score': 5.0}
        }
        workspace_service.active_workspaces[workspace_id] = workspace

        # Mock
        mock_questions = [
            {'question': 'Quel est votre numéro de téléphone?', 'field_type': 'phone'},
            {'question': 'Quel est votre email?', 'field_type': 'email'}
        ]
        mock_form = {'id': 'info_form_123', 'fields': []}

        workspace_service.human_thought_sim.generate_questions.return_value = mock_questions
        workspace_service.form_generator.generate_form.return_value = mock_form
        workspace_service.logger.log_workspace_event.return_value = "log_id_999"

        result = await workspace_service.process_workspace(
            workspace_id=workspace_id,
            action='request_missing_info'
        )

        assert result['status'] == 'info_requested'
        assert result['form'] == mock_form
        assert workspace['info_request_form'] == mock_form
        assert workspace['status'] == 'waiting_info'

    @pytest.mark.asyncio
    async def test_process_workspace_analyze_complexity(self, workspace_service, sample_email, sample_analysis):
        """Test traitement action analyze_complexity"""
        workspace_id = str(uuid.uuid4())
        workspace = {
            'id': workspace_id,
            'type': 'legal',
            'status': 'processing',
            'email': sample_email,
            'analysis': sample_analysis,
            'user_plan': 'PRO',
            'history': [],
            'metrics': {'processing_time_seconds': 0, 'ai_calls_count': 0, 'complexity_score': 5.0}
        }
        workspace_service.active_workspaces[workspace_id] = workspace

        # Mock nouvelle analyse
        new_analysis = {'complexity_score': 8.5}
        workspace_service.ai_service.analyze_smart.return_value = new_analysis
        workspace_service.logger.log_workspace_event.return_value = "log_id_111"

        result = await workspace_service.process_workspace(
            workspace_id=workspace_id,
            action='analyze_complexity'
        )

        assert result['status'] == 'complexity_analyzed'
        assert result['new_complexity_score'] == 8.5
        assert workspace['analysis']['complexity_score'] == 8.5
        assert workspace['metrics']['complexity_score'] == 8.5

    @pytest.mark.asyncio
    async def test_process_workspace_complete_workspace(self, workspace_service, sample_email, sample_analysis):
        """Test traitement action complete_workspace"""
        workspace_id = str(uuid.uuid4())
        workspace = {
            'id': workspace_id,
            'type': 'administrative',
            'status': 'processing',
            'email': sample_email,
            'analysis': sample_analysis,
            'user_plan': 'AIDANT',
            'history': [],
            'metrics': {'processing_time_seconds': 10.5, 'ai_calls_count': 3, 'complexity_score': 6.0}
        }
        workspace_service.active_workspaces[workspace_id] = workspace

        workspace_service.logger.log_workspace_event.return_value = "log_id_222"

        result = await workspace_service.process_workspace(
            workspace_id=workspace_id,
            action='complete_workspace'
        )

        assert result['status'] == 'workspace_completed'
        assert result['processing_time'] == 10.5
        assert result['ai_calls'] == 3
        assert workspace['status'] == 'completed'
        assert 'completed_at' in workspace

    @pytest.mark.asyncio
    async def test_process_workspace_unknown_action(self, workspace_service, sample_email):
        """Test traitement action inconnue"""
        workspace_id = str(uuid.uuid4())
        workspace = {
            'id': workspace_id,
            'type': 'general',
            'status': 'created',
            'email': sample_email,
            'analysis': {},
            'history': [],
            'metrics': {'processing_time_seconds': 0, 'ai_calls_count': 0, 'complexity_score': 5.0}
        }
        workspace_service.active_workspaces[workspace_id] = workspace

        with pytest.raises(ValueError, match="Unknown action: unknown_action"):
            await workspace_service.process_workspace(
                workspace_id=workspace_id,
                action='unknown_action'
            )

    @pytest.mark.asyncio
    async def test_process_workspace_not_found(self, workspace_service):
        """Test traitement workspace inexistant"""
        with pytest.raises(ValueError, match="Workspace nonexistent not found"):
            await workspace_service.process_workspace(
                workspace_id='nonexistent',
                action='generate_response'
            )

    def test_get_workspace(self, workspace_service, sample_email):
        """Test récupération workspace"""
        workspace_id = str(uuid.uuid4())
        workspace = {
            'id': workspace_id,
            'type': 'general',
            'email': sample_email
        }
        workspace_service.active_workspaces[workspace_id] = workspace

        result = workspace_service.get_workspace(workspace_id)
        assert result == workspace

        # Workspace inexistant
        assert workspace_service.get_workspace('nonexistent') is None

    def test_list_workspaces(self, workspace_service):
        """Test listage workspaces"""
        # Créer quelques workspaces
        workspaces = []
        for i in range(5):
            workspace_id = str(uuid.uuid4())
            workspace = {
                'id': workspace_id,
                'type': 'general' if i < 3 else 'mdph',
                'status': 'created' if i < 2 else 'completed',
                'user_id': f'user_{i}' if i < 4 else None,
                'created_at': f'2024-01-{10+i:02d}T10:00:00'
            }
            workspace_service.active_workspaces[workspace_id] = workspace
            workspaces.append(workspace)

        # Test sans filtres
        result = workspace_service.list_workspaces()
        assert len(result) == 5

        # Test avec user_id
        result = workspace_service.list_workspaces(user_id='user_1')
        assert len(result) == 1
        assert result[0]['user_id'] == 'user_1'

        # Test avec status
        result = workspace_service.list_workspaces(status='completed')
        assert len(result) == 3

        # Test avec limit
        result = workspace_service.list_workspaces(limit=2)
        assert len(result) == 2

        # Vérifier tri par date décroissante
        assert result[0]['created_at'] > result[1]['created_at']

    @pytest.mark.asyncio
    async def test_cleanup_old_workspaces(self, workspace_service):
        """Test nettoyage workspaces anciens"""
        # Créer workspaces avec différentes dates
        import time
        current_time = time.time()

        # Workspace récent
        recent_id = str(uuid.uuid4())
        workspace_service.active_workspaces[recent_id] = {
            'id': recent_id,
            'created_at': datetime.fromtimestamp(current_time - 10*24*60*60).isoformat()  # 10 jours
        }

        # Workspace ancien
        old_id = str(uuid.uuid4())
        workspace_service.active_workspaces[old_id] = {
            'id': old_id,
            'created_at': datetime.fromtimestamp(current_time - 40*24*60*60).isoformat()  # 40 jours
        }

        # Nettoyer
        removed_count = await workspace_service.cleanup_old_workspaces(days_old=30)

        assert removed_count == 1
        assert old_id not in workspace_service.active_workspaces
        assert recent_id in workspace_service.active_workspaces

    def test_get_workspace_stats(self, workspace_service):
        """Test statistiques workspaces"""
        # Ajouter quelques workspaces
        for i in range(3):
            workspace_id = str(uuid.uuid4())
            workspace = {
                'id': workspace_id,
                'type': 'mdph' if i == 0 else 'general',
                'status': 'created' if i < 2 else 'completed'
            }
            workspace_service.active_workspaces[workspace_id] = workspace

        stats = workspace_service.get_workspace_stats()

        assert stats['total_workspaces'] == 3
        assert stats['status_distribution']['created'] == 2
        assert stats['status_distribution']['completed'] == 1
        assert stats['type_distribution']['mdph'] == 1
        assert stats['type_distribution']['general'] == 2
        assert len(stats['active_workspaces']) == 2  # created status

    @pytest.mark.asyncio
    async def test_error_handling_ai_service_failure(self, workspace_service, sample_email):
        """Test gestion erreur service IA"""
        # Mock échec analyse IA
        workspace_service.ai_service.analyze_smart.side_effect = Exception("AI service unavailable")

        with pytest.raises(Exception):
            await workspace_service.create_workspace(
                email_content=sample_email['content'],
                email_subject=sample_email['subject'],
                email_sender=sample_email['sender']
            )

    @pytest.mark.asyncio
    async def test_multilanguage_support(self, workspace_service, sample_email, sample_analysis):
        """Test support multi-langue"""
        workspace_service.ai_service.analyze_smart.return_value = sample_analysis
        workspace_service.logger.log_workspace_event.return_value = "log_id_123"

        # Test avec différentes langues
        for lang in ['fr', 'en', 'es', 'ar']:
            workspace = await workspace_service.create_workspace(
                email_content=sample_email['content'],
                email_subject=sample_email['subject'],
                email_sender=sample_email['sender'],
                language=lang
            )
            assert workspace['language'] == lang

    @pytest.mark.asyncio
    async def test_accessibility_modes(self, workspace_service, sample_email, sample_analysis):
        """Test modes d'accessibilité"""
        workspace_service.ai_service.analyze_smart.return_value = sample_analysis
        workspace_service.logger.log_workspace_event.return_value = "log_id_123"

        accessibility_modes = ['malvoyant', 'deficience_motrice', 'dyslexie', 'deficience_intellectuelle']

        for mode in accessibility_modes:
            workspace = await workspace_service.create_workspace(
                email_content=sample_email['content'],
                email_subject=sample_email['subject'],
                email_sender=sample_email['sender'],
                accessibility_mode=mode
            )
            assert workspace['accessibility_mode'] == mode

    @pytest.mark.asyncio
    async def test_workspace_lifecycle(self, workspace_service, sample_email, sample_analysis):
        """Test cycle de vie complet d'un workspace"""
        workspace_service.ai_service.analyze_smart.return_value = sample_analysis
        workspace_service.logger.log_workspace_event.return_value = "log_id_123"

        # 1. Création
        workspace = await workspace_service.create_workspace(
            email_content=sample_email['content'],
            email_subject=sample_email['subject'],
            email_sender=sample_email['sender'],
            workspace_type=WorkspaceType.MDPH
        )
        assert workspace['status'] == 'created'

        workspace_id = workspace['id']

        # 2. Génération formulaire
        workspace_service.human_thought_sim.generate_questions.return_value = []
        workspace_service.form_generator.generate_form.return_value = {'id': 'form_123'}
        workspace_service.logger.log_workspace_event.return_value = "log_id_456"

        result = await workspace_service.process_workspace(
            workspace_id=workspace_id,
            action='generate_form'
        )
        assert result['status'] == 'form_generated'
        assert workspace_service.active_workspaces[workspace_id]['status'] == 'waiting_info'

        # 3. Finalisation
        workspace_service.logger.log_workspace_event.return_value = "log_id_789"
        result = await workspace_service.process_workspace(
            workspace_id=workspace_id,
            action='complete_workspace'
        )
        assert result['status'] == 'workspace_completed'
        assert workspace_service.active_workspaces[workspace_id]['status'] == 'completed'

    @pytest.mark.asyncio
    async def test_concurrent_workspace_processing(self, workspace_service, sample_email, sample_analysis):
        """Test traitement concurrent de workspaces"""
        workspace_service.ai_service.analyze_smart.return_value = sample_analysis
        workspace_service.logger.log_workspace_event.return_value = "log_id_123"

        # Créer plusieurs workspaces simultanément
        tasks = []
        for i in range(5):
            task = workspace_service.create_workspace(
                email_content=f"{sample_email['content']} - Instance {i}",
                email_subject=sample_email['subject'],
                email_sender=f"user{i}@example.com",
                workspace_type=WorkspaceType.GENERAL
            )
            tasks.append(task)

        workspaces = await asyncio.gather(*tasks)

        assert len(workspaces) == 5
        assert len(workspace_service.active_workspaces) == 5

        # Vérifier IDs uniques
        ids = [w['id'] for w in workspaces]
        assert len(set(ids)) == 5

    @pytest.mark.asyncio
    async def test_metrics_tracking(self, workspace_service, sample_email, sample_analysis):
        """Test suivi des métriques"""
        workspace_service.ai_service.analyze_smart.return_value = sample_analysis
        workspace_service.logger.log_workspace_event.return_value = "log_id_123"

        # Créer workspace
        workspace = await workspace_service.create_workspace(
            email_content=sample_email['content'],
            email_subject=sample_email['subject'],
            email_sender=sample_email['sender']
        )

        initial_ai_calls = workspace['metrics']['ai_calls_count']
        initial_time = workspace['metrics']['processing_time_seconds']

        # Simuler plusieurs actions
        workspace_service.responder.generate_response.return_value = {'content': 'Response'}
        workspace_service.logger.log_workspace_event.return_value = "log_id_456"

        await workspace_service.process_workspace(
            workspace_id=workspace['id'],
            action='generate_response'
        )

        # Vérifier mise à jour métriques
        updated_workspace = workspace_service.active_workspaces[workspace['id']]
        assert updated_workspace['metrics']['ai_calls_count'] > initial_ai_calls
        assert updated_workspace['metrics']['processing_time_seconds'] >= initial_time
        assert len(updated_workspace['history']) == 2  # création + action


# Tests d'intégration (avec mocks réalistes)
class TestWorkspaceServiceIntegration:
    """Tests d'intégration pour WorkspaceService"""

    @pytest.fixture
    def integration_service(self):
        """Service avec mocks réalistes pour tests d'intégration"""
        service = WorkspaceService()

        # Mock avec comportements réalistes
        service.ai_service.analyze_smart = AsyncMock(side_effect=self._mock_ai_analysis)
        service.responder.generate_response = AsyncMock(side_effect=self._mock_response_generation)
        service.form_generator.generate_form = AsyncMock(side_effect=self._mock_form_generation)
        service.logger.log_workspace_event = AsyncMock(return_value="log_id")

        return service

    def _mock_ai_analysis(self, prompt, context, user_plan):
        """Mock réaliste pour analyse IA"""
        if 'MDPH' in prompt:
            return {
                'complexity_score': 8.0,
                'priority': 'high',
                'missing_info': ['numero_securite_sociale', 'date_naissance'],
                'suggested_actions': ['generate_form'],
                'response_type': 'request_info',
                'needs_form': True,
                'keywords': ['MDPH', 'handicap'],
                'sentiment': 'neutral',
                'confidentiality_level': 'high'
            }
        else:
            return {
                'complexity_score': 4.0,
                'priority': 'medium',
                'missing_info': [],
                'suggested_actions': ['generate_response'],
                'response_type': 'answer',
                'needs_form': False,
                'keywords': ['general'],
                'sentiment': 'positive',
                'confidentiality_level': 'medium'
            }

    def _mock_response_generation(self, email_content, email_subject, workspace_analysis, tone, language, user_plan):
        """Mock réaliste pour génération de réponse"""
        return {
            'content': f'Réponse générée pour: {email_subject}',
            'tone': tone,
            'language': language,
            'generated_at': datetime.utcnow().isoformat()
        }

    def _mock_form_generation(self, questions, form_type, accessibility_mode, language, user_data):
        """Mock réaliste pour génération de formulaire"""
        return {
            'id': f'form_{uuid.uuid4().hex[:8]}',
            'type': form_type,
            'language': language,
            'accessibility_mode': accessibility_mode,
            'questions_count': len(questions),
            'steps': [{
                'title': 'Informations requises',
                'fields': [
                    {
                        'id': f'field_{i}',
                        'type': 'text',
                        'label': q.get('question', f'Question {i}'),
                        'required': True
                    } for i, q in enumerate(questions)
                ]
            }]
        }

    @pytest.mark.asyncio
    async def test_full_mdph_workflow(self, integration_service):
        """Test workflow complet MDPH"""
        # 1. Créer workspace MDPH
        workspace = await integration_service.create_workspace(
            email_content="Bonjour, je souhaite faire une demande MDPH pour reconnaissance handicap visuel.",
            email_subject="Demande MDPH - Handicap visuel",
            email_sender="patient@example.com",
            workspace_type=WorkspaceType.MDPH,
            user_plan="PREMIUM",
            language="fr",
            accessibility_mode="malvoyant"
        )

        assert workspace['type'] == 'mdph'
        assert workspace['analysis']['complexity_score'] == 8.0
        assert workspace['analysis']['needs_form'] == True

        # 2. Générer formulaire
        result = await integration_service.process_workspace(
            workspace_id=workspace['id'],
            action='generate_form'
        )

        assert result['status'] == 'form_generated'
        assert 'numero_securite_sociale' in str(result['form'])

        # 3. Générer réponse
        result = await integration_service.process_workspace(
            workspace_id=workspace['id'],
            action='generate_response',
            parameters={'tone': 'empathic'}
        )

        assert result['status'] == 'response_generated'
        assert 'handicap' in result['response']['content'].lower()

        # 4. Finaliser
        result = await integration_service.process_workspace(
            workspace_id=workspace['id'],
            action='complete_workspace'
        )

        assert result['status'] == 'workspace_completed'
        final_workspace = integration_service.active_workspaces[workspace['id']]
        assert final_workspace['status'] == 'completed'

    @pytest.mark.asyncio
    async def test_simple_general_workflow(self, integration_service):
        """Test workflow simple général"""
        # Créer workspace général simple
        workspace = await integration_service.create_workspace(
            email_content="Bonjour, pouvez-vous me donner des informations sur vos services?",
            email_subject="Demande d'informations",
            email_sender="client@example.com",
            workspace_type=WorkspaceType.GENERAL,
            user_plan="FREE"
        )

        assert workspace['type'] == 'general'
        assert workspace['analysis']['complexity_score'] == 4.0
        assert workspace['analysis']['needs_form'] == False

        # Générer réponse directement
        result = await integration_service.process_workspace(
            workspace_id=workspace['id'],
            action='generate_response'
        )

        assert result['status'] == 'response_generated'
        assert workspace['status'] == 'completed'
