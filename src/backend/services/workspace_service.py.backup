"""
Workspace Service for IA Poste Manager

Orchestrates all services to provide complete workspace functionality:
- Email analysis and processing
- AI-powered response generation
- Interactive form generation
- Human thought simulation for missing info
- Security and access control
- Multi-language and accessibility support
"""

import logging
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

from .human_thought_sim import HumanThoughtSimulator, QuestionType, QuestionPriority
from .responder import ResponderService, ResponseTone, ResponseType
from .form_generator import FormGenerator, AccessibilityMode
from .security import SecurityService
from .external_ai_service import ExternalAIService
from .logger import LoggerService

logger = logging.getLogger(__name__)


class WorkspaceType(str, Enum):
    """Types de workspace disponibles"""
    GENERAL = "general"
    MDPH = "mdph"
    ADMINISTRATIVE = "administrative"
    LEGAL = "legal"
    MEDICAL = "medical"


class WorkspacePriority(str, Enum):
    """Priorités de traitement"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class WorkspaceStatus(str, Enum):
    """États du workspace"""
    CREATED = "created"
    ANALYZING = "analyzing"
    PROCESSING = "processing"
    WAITING_INFO = "waiting_info"
    GENERATING_RESPONSE = "generating_response"
    COMPLETED = "completed"
    ERROR = "error"


class WorkspaceService:
    """Service principal de gestion des workspaces"""

    def __init__(self):
        self.human_thought_sim = HumanThoughtSimulator()
        self.responder = ResponderService()
        self.form_generator = FormGenerator()
        self.security = SecurityService()
        self.ai_service = ExternalAIService()
        self.logger = LoggerService()

        # Cache des workspaces actifs
        self.active_workspaces = {}

    async def create_workspace(
        self,
        email_content: str,
        email_subject: str,
        email_sender: str,
        workspace_type: WorkspaceType = WorkspaceType.GENERAL,
        user_id: Optional[str] = None,
        user_plan: str = "FREE",
        language: str = "fr",
        accessibility_mode: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crée un nouveau workspace pour traiter un email

        Args:
            email_content: Contenu de l'email
            email_subject: Sujet de l'email
            email_sender: Expéditeur
            workspace_type: Type de workspace
            user_id: ID utilisateur
            user_plan: Plan de l'utilisateur
            language: Langue préférée
            accessibility_mode: Mode d'accessibilité

        Returns:
            Workspace complet avec analyse initiale
        """

        workspace_id = str(uuid.uuid4())

        # Analyse initiale avec IA
        analysis = await self._analyze_email_content(
            email_content=email_content,
            email_subject=email_subject,
            workspace_type=workspace_type,
            user_plan=user_plan
        )

        # Créer le workspace
        workspace = {
            'id': workspace_id,
            'type': workspace_type.value,
            'status': WorkspaceStatus.CREATED.value,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'user_plan': user_plan,
            'language': language,
            'accessibility_mode': accessibility_mode,

            # Contenu original
            'email': {
                'subject': email_subject,
                'content': email_content,
                'sender': email_sender
            },

            # Analyse IA
            'analysis': analysis,

            # Actions suggérées
            'suggested_actions': analysis.get('suggested_actions', []),

            # Informations manquantes
            'missing_info': analysis.get('missing_info', []),

            # Réponse générée (si applicable)
            'generated_response': None,

            # Formulaire généré (si applicable)
            'generated_form': None,

            # Métriques
            'metrics': {
                'processing_time_seconds': 0,
                'ai_calls_count': 1,  # Analyse initiale
                'complexity_score': analysis.get('complexity_score', 5.0)
            },

            # Historique des actions
            'history': [{
                'timestamp': datetime.utcnow().isoformat(),
                'action': 'workspace_created',
                'details': f'Workspace {workspace_type.value} créé pour email de {email_sender}'
            }]
        }

        # Stocker en cache
        self.active_workspaces[workspace_id] = workspace

        # Logger la création
        await self.logger.log_workspace_event(
            workspace_id=workspace_id,
            event_type='created',
            details={
                'workspace_type': workspace_type.value,
                'user_plan': user_plan,
                'complexity_score': analysis.get('complexity_score', 5.0)
            }
        )

        return workspace

    async def process_workspace(
        self,
        workspace_id: str,
        action: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Traite un workspace selon l'action demandée

        Args:
            workspace_id: ID du workspace
            action: Action à effectuer
            parameters: Paramètres supplémentaires

        Returns:
            Résultat du traitement
        """

        if workspace_id not in self.active_workspaces:
            raise ValueError(f"Workspace {workspace_id} not found")

        workspace = self.active_workspaces[workspace_id]
        parameters = parameters or {}

        # Mettre à jour le statut
        workspace['status'] = WorkspaceStatus.PROCESSING.value
        workspace['updated_at'] = datetime.utcnow().isoformat()

        try:
            if action == 'generate_response':
                result = await self._generate_response(workspace, parameters)

            elif action == 'generate_form':
                result = await self._generate_form(workspace, parameters)

            elif action == 'request_missing_info':
                result = await self._request_missing_info(workspace, parameters)

            elif action == 'analyze_complexity':
                result = await self._analyze_complexity(workspace, parameters)

            elif action == 'complete_workspace':
                result = await self._complete_workspace(workspace, parameters)

            else:
                raise ValueError(f"Unknown action: {action}")

            # Mettre à jour métriques
            workspace['metrics']['processing_time_seconds'] += result.get('processing_time', 0)
            workspace['metrics']['ai_calls_count'] += result.get('ai_calls', 0)

            # Ajouter à l'historique
            workspace['history'].append({
                'timestamp': datetime.utcnow().isoformat(),
                'action': action,
                'result': result.get('status', 'completed'),
                'details': result.get('message', '')
            })

            # Logger l'action
            await self.logger.log_workspace_event(
                workspace_id=workspace_id,
                event_type=action,
                details=result
            )

            return result

        except Exception as e:
            logger.error(f"Error processing workspace {workspace_id}: {str(e)}")
            workspace['status'] = WorkspaceStatus.ERROR.value

            await self.logger.log_workspace_event(
                workspace_id=workspace_id,
                event_type='error',
                details={'error': str(e)}
            )

            raise

    async def _analyze_email_content(
        self,
        email_content: str,
        email_subject: str,
        workspace_type: WorkspaceType,
        user_plan: str
    ) -> Dict[str, Any]:
        """Analyse le contenu de l'email avec IA"""

        prompt = f"""
        Analyse cet email et fournis une réponse structurée JSON.

        EMAIL SUJET: {email_subject}
        EMAIL CONTENU:
        {email_content[:1000]}

        TYPE DE WORKSPACE: {workspace_type.value}

        Fournis une réponse JSON avec:
        {{
            "complexity_score": 1-10 (1=simple, 10=très complexe),
            "priority": "low/medium/high/urgent",
            "missing_info": ["info manquante 1", "info manquante 2"],
            "suggested_actions": ["action 1", "action 2"],
            "response_type": "answer/request_info/acknowledge/forward/appointment",
            "estimated_processing_time": 300,
            "requires_human_review": false
        }}
        """

        try:
            analysis_result = await self.ai_service.analyze_with_ai(
                content=prompt,
                model="gpt-3.5-turbo" if user_plan != "FREE" else "ollama"
            )
            
            return {
                'complexity_score': analysis_result.get('complexity_score', 5.0),
                'priority': analysis_result.get('priority', 'medium'),
                'missing_info': analysis_result.get('missing_info', []),
                'suggested_actions': analysis_result.get('suggested_actions', []),
                'response_type': analysis_result.get('response_type', 'answer'),
                'estimated_processing_time': analysis_result.get('estimated_processing_time', 300),
                'requires_human_review': analysis_result.get('requires_human_review', False)
            }
        except Exception as e:
            logger.error(f"Error in AI analysis: {str(e)}")
            return {
                'complexity_score': 5.0,
                'priority': 'medium',
                'missing_info': [],
                'suggested_actions': ['manual_review'],
                'response_type': 'answer',
                'estimated_processing_time': 300,
                'requires_human_review': True
            }

    async def _generate_response(
        self,
        workspace: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Génère une réponse IA pour l'email"""
        
        workspace['status'] = WorkspaceStatus.GENERATING_RESPONSE.value
        
        tone = parameters.get('tone', 'professional')
        response_type = parameters.get('response_type', 'answer')
        
        try:
            # Utiliser le service de réponse
            response_result = await self.responder.generate_response(
                email_content=workspace['email']['content'],
                email_subject=workspace['email']['subject'],
                context=workspace['analysis'],
                tone=ResponseTone(tone),
                response_type=ResponseType(response_type),
                language=workspace.get('language', 'fr')
            )
            
            workspace['generated_response'] = response_result
            workspace['status'] = WorkspaceStatus.COMPLETED.value
            
            return {
                'status': 'success',
                'message': 'Réponse générée avec succès',
                'response': response_result,
                'processing_time': response_result.get('generation_time', 0),
                'ai_calls': 1
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            workspace['status'] = WorkspaceStatus.ERROR.value
            raise

    async def _generate_form(
        self,
        workspace: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Génère un formulaire interactif"""
        
        form_type = parameters.get('form_type', 'information_request')
        accessibility_mode = parameters.get('accessibility_mode', workspace.get('accessibility_mode'))
        
        try:
            # Utiliser le générateur de formulaires
            form_result = await self.form_generator.generate_form(
                context=workspace['analysis'],
                form_type=form_type,
                missing_info=workspace['analysis'].get('missing_info', []),
                accessibility_mode=AccessibilityMode(accessibility_mode) if accessibility_mode else None,
                language=workspace.get('language', 'fr')
            )
            
            workspace['generated_form'] = form_result
            
            return {
                'status': 'success',
                'message': 'Formulaire généré avec succès',
                'form': form_result,
                'processing_time': form_result.get('generation_time', 0),
                'ai_calls': 1
            }
            
        except Exception as e:
            logger.error(f"Error generating form: {str(e)}")
            raise

    async def _request_missing_info(
        self,
        workspace: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Demande les informations manquantes via simulation humaine"""
        
        workspace['status'] = WorkspaceStatus.WAITING_INFO.value
        
        try:
            # Utiliser le simulateur de pensée humaine
            questions_result = await self.human_thought_sim.generate_contextual_questions(
                email_content=workspace['email']['content'],
                missing_info=workspace['analysis'].get('missing_info', []),
                context_type=workspace['type'],
                max_questions=parameters.get('max_questions', 5),
                language=workspace.get('language', 'fr')
            )
            
            return {
                'status': 'success',
                'message': 'Questions générées pour informations manquantes',
                'questions': questions_result,
                'processing_time': questions_result.get('generation_time', 0),
                'ai_calls': 1
            }
            
        except Exception as e:
            logger.error(f"Error requesting missing info: {str(e)}")
            raise

    async def _analyze_complexity(
        self,
        workspace: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyse la complexité du workspace"""
        
        try:
            complexity_factors = {
                'email_length': len(workspace['email']['content']),
                'missing_info_count': len(workspace['analysis'].get('missing_info', [])),
                'suggested_actions_count': len(workspace['analysis'].get('suggested_actions', [])),
                'workspace_type': workspace['type'],
                'requires_human_review': workspace['analysis'].get('requires_human_review', False)
            }
            
            # Calcul du score de complexité
            complexity_score = 1.0
            
            # Facteurs de complexité
            if complexity_factors['email_length'] > 1000:
                complexity_score += 2.0
            if complexity_factors['missing_info_count'] > 3:
                complexity_score += 1.5
            if complexity_factors['suggested_actions_count'] > 5:
                complexity_score += 1.0
            if complexity_factors['workspace_type'] in ['mdph', 'legal', 'medical']:
                complexity_score += 2.0
            if complexity_factors['requires_human_review']:
                complexity_score += 3.0
                
            complexity_score = min(complexity_score, 10.0)
            
            workspace['analysis']['complexity_score'] = complexity_score
            workspace['metrics']['complexity_score'] = complexity_score
            
            return {
                'status': 'success',
                'message': 'Analyse de complexité terminée',
                'complexity_score': complexity_score,
                'factors': complexity_factors,
                'processing_time': 0.1,
                'ai_calls': 0
            }
            
        except Exception as e:
            logger.error(f"Error analyzing complexity: {str(e)}")
            raise

    async def _complete_workspace(
        self,
        workspace: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Finalise le workspace"""
        
        try:
            workspace['status'] = WorkspaceStatus.COMPLETED.value
            workspace['completed_at'] = datetime.utcnow().isoformat()
            
            # Calculer métriques finales
            total_time = (datetime.utcnow() - datetime.fromisoformat(workspace['created_at'])).total_seconds()
            workspace['metrics']['total_processing_time'] = total_time
            
            # Nettoyer le cache si demandé
            if parameters.get('cleanup_cache', True):
                if workspace['id'] in self.active_workspaces:
                    del self.active_workspaces[workspace['id']]
            
            return {
                'status': 'success',
                'message': 'Workspace complété avec succès',
                'final_metrics': workspace['metrics'],
                'processing_time': 0.1,
                'ai_calls': 0
            }
            
        except Exception as e:
            logger.error(f"Error completing workspace: {str(e)}")
            raise

    async def get_workspace(self, workspace_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un workspace par son ID"""
        return self.active_workspaces.get(workspace_id)

    async def list_workspaces(
        self,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        workspace_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Liste les workspaces avec filtres optionnels"""
        
        workspaces = list(self.active_workspaces.values())
        
        if user_id:
            workspaces = [w for w in workspaces if w.get('user_id') == user_id]
        
        if status:
            workspaces = [w for w in workspaces if w.get('status') == status]
            
        if workspace_type:
            workspaces = [w for w in workspaces if w.get('type') == workspace_type]
        
        return workspaces

    async def delete_workspace(self, workspace_id: str) -> bool:
        """Supprime un workspace"""
        if workspace_id in self.active_workspaces:
            del self.active_workspaces[workspace_id]
            
            await self.logger.log_workspace_event(
                workspace_id=workspace_id,
                event_type='deleted',
                details={'timestamp': datetime.utcnow().isoformat()}
            )
            
            return True
        return False

    async def get_workspace_metrics(self, workspace_id: str) -> Optional[Dict[str, Any]]:
        """Récupère les métriques d'un workspace"""
        workspace = self.active_workspaces.get(workspace_id)
        if workspace:
            return workspace.get('metrics', {})
        return None
