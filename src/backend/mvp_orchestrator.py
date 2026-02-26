"""
Orchestrateur principal du MVP memoLib
================================================

Point d'entrée unique pour orchestrer tous les services :
- Workspace management (création, traitement, workflow)
- Analyse email avec IA locale
- Génération de questions humaines
- Génération de formulaires accessibles
- Génération de réponses adaptatives
- Sécurité et chiffrement RGPD
- Journalisation complète
- Multi-canal (email, chat, SMS, etc.)
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

# Sécurité
from security.secrets_manager import get_secrets_manager
from security.encryption import get_encryption
from security.middleware import get_security

# Services métier
from src.backend.services.workspace_service import (
    WorkspaceService,
    WorkspaceType,
    WorkspacePriority,
    WorkspaceStatus
)
from src.backend.services.human_thought_sim import HumanThoughtSimulator
from src.backend.services.responder import ResponderService
from src.backend.services.form_generator import FormGenerator
from src.backend.services.logger import LoggerService


class Channel(str, Enum):
    """Canaux de communication supportés"""
    EMAIL = "email"
    CHAT = "chat"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    TEAMS = "teams"
    SLACK = "slack"
    WEB_FORM = "web_form"
    API = "api"


class MVPOrchestrator:
    """
    Orchestrateur principal du MVP
    
    Coordonne tous les services pour fournir :
    - Création et gestion de workspaces
    - Traitement multi-canal
    - Sécurité bout en bout
    - Workflows automatisés
    """
    
    def __init__(self):
        """Initialise l'orchestrateur et tous les services"""
        
        self.logger = logging.getLogger(__name__)
        
        # Sécurité
        self.secrets_manager = get_secrets_manager()
        self.encryption = get_encryption()
        self.security = get_security()
        
        # Services métier
        self.workspace_service = WorkspaceService()
        self.human_thought_sim = HumanThoughtSimulator()
        self.responder = ResponderService()
        self.form_generator = FormGenerator()
        self.logger_service = LoggerService()
        
        # État
        self.is_initialized = False
        
        self.logger.info("🚀 MVPOrchestrator initialisé")
    
    async def initialize(self) -> bool:
        """
        Initialise tous les services et vérifie la configuration
        
        Returns:
            True si succès
        """
        try:
            self.logger.info("Initialisation de l'orchestrateur...")
            
            # 1. Vérifier les clés API critiques
            openai_key = self.secrets_manager.get_secret('OPENAI_API_KEY')
            if not openai_key:
                self.logger.warning("OPENAI_API_KEY manquante - Mode IA externe désactivé")
            
            # 2. Initialiser les services
            # (les services s'initialisent déjà dans leur __init__)
            
            # 3. Tester la connectivité
            # TODO: Ajouter tests de connectivité aux services externes
            
            self.is_initialized = True
            self.logger.info("✅ Orchestrateur initialisé avec succès")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Erreur lors de l'initialisation : {e}")
            return False
    
    async def process_incoming_message(
        self,
        content: str,
        subject: str = "",
        sender: str = "",
        channel: Channel = Channel.EMAIL,
        attachments: Optional[List[Dict[str, Any]]] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Point d'entrée principal pour traiter un message entrant
        
        Args:
            content: Contenu du message
            subject: Sujet (pour email)
            sender: Expéditeur
            channel: Canal de communication
            attachments: Pièces jointes
            user_id: ID utilisateur (si authentifié)
            metadata: Métadonnées additionnelles
        
        Returns:
            Résultat du traitement avec workspace créé
        """
        
        if not self.is_initialized:
            await self.initialize()
        
        start_time = datetime.utcnow()
        
        try:
            self.logger.info(f"📥 Traitement message depuis {channel.value}")
            
            # 1. Anonymiser les données sensibles pour les logs (RGPD)
            sender_hash = self.encryption.anonymize_email(sender)
            
            self.logger_service.log_event(
                'message_received',
                {
                    'channel': channel.value,
                    'sender_hash': sender_hash,
                    'has_attachments': bool(attachments),
                    'user_id': user_id
                }
            )
            
            # 2. Créer le workspace
            workspace_type = self._detect_workspace_type(content, subject)
            
            workspace = await self.workspace_service.create_workspace(
                email_content=content,
                email_subject=subject,
                email_sender=sender,
                workspace_type=workspace_type,
                user_id=user_id,
                language=metadata.get('language', 'fr') if metadata else 'fr',
                accessibility_mode=metadata.get('accessibility_mode') if metadata else None
            )
            
            workspace_id = workspace['workspace_id']
            
            # 3. Traiter le workspace
            result = await self._process_workspace(
                workspace_id=workspace_id,
                workspace=workspace,
                attachments=attachments,
                metadata=metadata
            )
            
            # 4. Calculer les métriques
            duration = (datetime.utcnow() - start_time).total_seconds()
            
            self.logger_service.log_performance(
                'message_processing',
                duration,
                {
                    'workspace_id': workspace_id,
                    'channel': channel.value,
                    'status': result['status']
                }
            )
            
            return {
                'success': True,
                'workspace_id': workspace_id,
                'workspace': workspace,
                'result': result,
                'processing_time': duration
            }
            
        except Exception as e:
            self.logger.error(f"❌ Erreur traitement message : {e}")
            
            self.logger_service.log_error(
                'message_processing_error',
                str(e),
                {'channel': channel.value}
            )
            
            return {
                'success': False,
                'error': str(e),
                'processing_time': (datetime.utcnow() - start_time).total_seconds()
            }
    
    async def _process_workspace(
        self,
        workspace_id: str,
        workspace: Dict[str, Any],
        attachments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Traite un workspace : analyse → questions → formulaire → réponse
        
        Args:
            workspace_id: ID du workspace
            workspace: Données du workspace
            attachments: Pièces jointes
            metadata: Métadonnées
        
        Returns:
            Résultat du traitement
        """
        
        try:
            # 1. Analyser les informations manquantes
            missing_info = workspace.get('missing_info', [])
            
            if missing_info:
                # 2. Générer des questions humaines
                questions = await self._generate_questions(
                    workspace_id=workspace_id,
                    missing_info=missing_info,
                    context=workspace.get('context', {}),
                    language=workspace.get('language', 'fr')
                )
                
                # 3. Générer un formulaire interactif
                form = await self._generate_form(
                    workspace_id=workspace_id,
                    questions=questions,
                    workspace_type=workspace.get('workspace_type'),
                    accessibility_mode=workspace.get('accessibility_mode'),
                    language=workspace.get('language', 'fr')
                )
                
                return {
                    'status': WorkspaceStatus.WAITING_INFO.value,
                    'missing_info': missing_info,
                    'questions': questions,
                    'form': form,
                    'needs_user_input': True
                }
            
            else:
                # 4. Toutes les infos présentes → Générer la réponse
                response = await self._generate_response(
                    workspace_id=workspace_id,
                    workspace=workspace,
                    metadata=metadata
                )
                
                return {
                    'status': WorkspaceStatus.COMPLETED.value,
                    'response': response,
                    'needs_user_input': False
                }
        
        except Exception as e:
            self.logger.error(f"Erreur traitement workspace {workspace_id} : {e}")
            raise
    
    async def _generate_questions(
        self,
        workspace_id: str,
        missing_info: List[str],
        context: Dict[str, Any],
        language: str = 'fr'
    ) -> List[Dict[str, Any]]:
        """Génère des questions humaines pour les infos manquantes"""
        
        self.logger.info(f"🤔 Génération de questions pour workspace {workspace_id}")
        
        questions = await self.human_thought_sim.generate_questions(
            missing_info=missing_info,
            context=context,
            language=language
        )
        
        self.logger_service.log_event(
            'questions_generated',
            {
                'workspace_id': workspace_id,
                'questions_count': len(questions),
                'language': language
            }
        )
        
        return questions
    
    async def _generate_form(
        self,
        workspace_id: str,
        questions: List[Dict[str, Any]],
        workspace_type: str,
        accessibility_mode: Optional[str],
        language: str = 'fr'
    ) -> Dict[str, Any]:
        """Génère un formulaire interactif accessible"""
        
        self.logger.info(f"📝 Génération de formulaire pour workspace {workspace_id}")
        
        form = self.form_generator.generate_form(
            questions=questions,
            form_type=workspace_type,
            accessibility_mode=accessibility_mode,
            language=language
        )
        
        self.logger_service.log_event(
            'form_generated',
            {
                'workspace_id': workspace_id,
                'form_id': form.get('form_id'),
                'fields_count': len(form.get('fields', [])),
                'accessibility_mode': accessibility_mode
            }
        )
        
        return form
    
    async def _generate_response(
        self,
        workspace_id: str,
        workspace: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Génère une réponse IA adaptée"""
        
        self.logger.info(f"✍️ Génération de réponse pour workspace {workspace_id}")
        
        response = await self.responder.generate_response(
            workspace=workspace,
            tone=metadata.get('tone') if metadata else None,
            language=workspace.get('language', 'fr')
        )
        
        self.logger_service.log_event(
            'response_generated',
            {
                'workspace_id': workspace_id,
                'response_type': response.get('type'),
                'language': workspace.get('language')
            }
        )
        
        return response
    
    def _detect_workspace_type(self, content: str, subject: str) -> WorkspaceType:
        """
        Détecte le type de workspace selon le contenu
        
        Args:
            content: Contenu du message
            subject: Sujet
        
        Returns:
            Type de workspace détecté
        """
        
        content_lower = (content + " " + subject).lower()
        
        # MDPH keywords
        mdph_keywords = ['mdph', 'handicap', 'aah', 'reconnaissance', 'invalidité']
        if any(keyword in content_lower for keyword in mdph_keywords):
            return WorkspaceType.MDPH
        
        # Legal keywords
        legal_keywords = ['juridique', 'avocat', 'tribunal', 'contentieux']
        if any(keyword in content_lower for keyword in legal_keywords):
            return WorkspaceType.LEGAL
        
        # Medical keywords
        medical_keywords = ['médical', 'santé', 'médecin', 'ordonnance']
        if any(keyword in content_lower for keyword in medical_keywords):
            return WorkspaceType.MEDICAL
        
        # Administrative keywords
        admin_keywords = ['administrative', 'préfecture', 'mairie', 'caf']
        if any(keyword in content_lower for keyword in admin_keywords):
            return WorkspaceType.ADMINISTRATIVE
        
        return WorkspaceType.GENERAL
    
    async def submit_form_response(
        self,
        workspace_id: str,
        form_id: str,
        responses: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Traite la soumission d'un formulaire
        
        Args:
            workspace_id: ID du workspace
            form_id: ID du formulaire
            responses: Réponses du formulaire
            user_id: ID utilisateur
        
        Returns:
            Résultat avec réponse générée ou nouvelles questions
        """
        
        try:
            self.logger.info(f"📬 Soumission formulaire {form_id} pour workspace {workspace_id}")
            
            # 1. Valider les réponses
            # TODO: Implémenter validation
            
            # 2. Mettre à jour le workspace avec les nouvelles infos
            # TODO: Récupérer et mettre à jour le workspace
            
            # 3. Vérifier s'il manque encore des infos
            # Si oui → nouvelles questions
            # Si non → générer réponse finale
            
            self.logger_service.log_event(
                'form_submitted',
                {
                    'workspace_id': workspace_id,
                    'form_id': form_id,
                    'fields_count': len(responses)
                }
            )
            
            return {
                'success': True,
                'workspace_id': workspace_id,
                'status': 'processed'
            }
            
        except Exception as e:
            self.logger.error(f"Erreur soumission formulaire : {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_workspace_status(self, workspace_id: str) -> Dict[str, Any]:
        """Récupère le statut d'un workspace"""
        
        # TODO: Implémenter récupération depuis cache ou DB
        
        return {
            'workspace_id': workspace_id,
            'status': 'unknown'
        }


# Instance globale (singleton)
_orchestrator_instance: Optional[MVPOrchestrator] = None


def get_orchestrator() -> MVPOrchestrator:
    """Récupère l'instance singleton de l'orchestrateur"""
    global _orchestrator_instance
    
    if _orchestrator_instance is None:
        _orchestrator_instance = MVPOrchestrator()
    
    return _orchestrator_instance
