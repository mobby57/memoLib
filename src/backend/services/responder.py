"""
Module de génération de réponses IA multi-ton et multi-langue

Fonctionnalités:
- Réponses dynamiques adaptées au contexte
- Ton configurable par type de mail et client
- Multi-langue avec détection automatique
- Intégration templates emails (Resend)
- Analyse prédictive de qualité de réponse
"""

import logging
import re
import time
from typing import Dict, List, Any, Optional
from enum import Enum
from datetime import datetime

from .external_ai_service import ExternalAIService
from .logger import LoggerService

logger = logging.getLogger(__name__)


class ResponseTone(str, Enum):
    """Tons de réponse disponibles"""
    FORMAL = "formal"  # Officiel, administratif
    FRIENDLY = "friendly"  # Amical, chaleureux
    EMPATHETIC = "empathetic"  # Empathique (MDPH, situations difficiles)
    PROFESSIONAL = "professional"  # Professionnel neutre
    CONCISE = "concise"  # Court et efficace
    DETAILED = "detailed"  # Détaillé avec explications


class ResponseType(str, Enum):
    """Types de réponse"""
    ANSWER = "answer"  # Réponse directe
    REQUEST_INFO = "request_info"  # Demande d'infos complémentaires
    ACKNOWLEDGE = "acknowledge"  # Accusé de réception
    FORWARD = "forward"  # Transfert à un service
    APPOINTMENT = "appointment"  # Proposition RDV
    REJECTION = "rejection"  # Refus poli


class Language(str, Enum):
    """Langues supportées"""
    FR = "fr"
    EN = "en"
    ES = "es"
    AR = "ar"
    DE = "de"


class ResponderService:
    """Service de génération de réponses intelligentes"""
    
    def __init__(self):
        self.ai_service = ExternalAIService()
        self.logger = LoggerService()
        self.templates_cache = {}
    
    async def generate_response(
        self,
        email_content: str,
        email_subject: str,
        workspace_analysis: Dict[str, Any],
        tone: ResponseTone = ResponseTone.PROFESSIONAL,
        language: Optional[Language] = None,
        user_plan: str = "FREE",
        client_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Génère une réponse dynamique adaptée au contexte
        
        Args:
            email_content: Contenu de l'email reçu
            email_subject: Sujet de l'email
            workspace_analysis: Analyse du workspace (de WorkspaceService)
            tone: Ton de la réponse
            language: Langue (détection auto si None)
            user_plan: Plan de l'utilisateur (FREE, AIDANT, PREMIUM, PRO)
            client_config: Configuration spécifique client
            
        Returns:
            {
                'subject': str,
                'body_text': str,
                'body_html': str,
                'attachments': List[str],
                'metadata': dict,
                'quality_score': float,
                'requires_validation': bool
            }
        """
        start_time = time.time()
        try:
            # Log start of response generation
            self.logger.log_service_event(
                service_name="ResponderService",
                event_type="response_generation_start",
                details={
                    "email_subject": email_subject[:100],
                    "tone": tone.value,
                    "language": language.value if language else "auto",
                    "user_plan": user_plan,
                    "has_client_config": client_config is not None
                }
            )

            # 1. Détecter langue si non spécifiée
            if not language:
                language = self._detect_language(email_content)

            # 2. Déterminer type de réponse approprié
            response_type = self._determine_response_type(workspace_analysis)

            # 3. Générer contenu avec IA
            response_content = await self._generate_response_content(
                email_content=email_content,
                email_subject=email_subject,
                workspace_analysis=workspace_analysis,
                response_type=response_type,
                tone=tone,
                language=language,
                user_plan=user_plan
            )

            # 4. Appliquer template email
            formatted_response = self._apply_email_template(
                content=response_content,
                tone=tone,
                language=language,
                client_config=client_config
            )

            # 5. Analyser qualité de la réponse
            quality_score = self._calculate_quality_score(
                response_content,
                workspace_analysis
            )

            # 6. Déterminer si validation humaine nécessaire
            requires_validation = self._requires_human_validation(
                workspace_analysis,
                quality_score,
                user_plan,
                client_config
            )

            execution_time = time.time() - start_time

            # Log successful completion
            self.logger.log_service_event(
                service_name="ResponderService",
                event_type="response_generation_success",
                details={
                    "response_type": response_type.value,
                    "language": language.value,
                    "quality_score": quality_score,
                    "requires_validation": requires_validation,
                    "ai_model": formatted_response.get('ai_model', 'ollama'),
                    "execution_time": execution_time
                }
            )

            return {
                'subject': self._generate_subject(email_subject, response_type, language),
                'body_text': formatted_response['text'],
                'body_html': formatted_response['html'],
                'attachments': formatted_response.get('attachments', []),
                'metadata': {
                    'response_type': response_type.value,
                    'tone': tone.value,
                    'language': language.value,
                    'generated_at': datetime.utcnow().isoformat(),
                    'ai_model': formatted_response.get('ai_model', 'ollama'),
                    'client_config_applied': client_config is not None
                },
                'quality_score': quality_score,
                'requires_validation': requires_validation,
                'validation_reasons': formatted_response.get('validation_reasons', [])
            }

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Error generating response: {str(e)}")

            # Log error
            self.logger.log_service_event(
                service_name="ResponderService",
                event_type="response_generation_error",
                details={
                    "error": str(e),
                    "email_subject": email_subject[:100] if email_subject else "N/A",
                    "execution_time": execution_time
                }
            )

            # Fallback: réponse générique
            return self._generate_fallback_response(language)
    
    def _detect_language(self, text: str) -> Language:
        """Détecte la langue du texte"""
        
        # Mots-clés par langue
        language_markers = {
            'fr': ['bonjour', 'merci', 'cordialement', 'madame', 'monsieur'],
            'en': ['hello', 'thank you', 'sincerely', 'dear', 'regards'],
            'es': ['hola', 'gracias', 'atentamente', 'señor', 'señora'],
            'ar': ['مرحبا', 'شكرا', 'السيد', 'السيدة'],
            'de': ['hallo', 'danke', 'sehr geehrte', 'mit freundlichen']
        }
        
        text_lower = text.lower()
        scores = {}
        
        for lang, markers in language_markers.items():
            scores[lang] = sum(1 for marker in markers if marker in text_lower)
        
        # Langue avec le plus de matches
        detected = max(scores, key=scores.get)
        
        # Si aucun match significatif, défaut français
        if scores[detected] == 0:
            detected = 'fr'
        
        return Language(detected)
    
    def _determine_response_type(
        self,
        workspace_analysis: Dict[str, Any]
    ) -> ResponseType:
        """Détermine le type de réponse approprié"""
        
        missing_info = workspace_analysis.get('missing_info', [])
        priority = workspace_analysis.get('priority', 'medium')
        complexity = workspace_analysis.get('analysis', {}).get('complexity_score', 5)
        
        # Besoin d'informations complémentaires
        if missing_info and len(missing_info) > 2:
            return ResponseType.REQUEST_INFO
        
        # Cas urgent → accusé réception rapide
        if priority == 'urgent':
            return ResponseType.ACKNOWLEDGE
        
        # Cas complexe → peut nécessiter transfert
        if complexity >= 8:
            return ResponseType.FORWARD
        
        # Par défaut: réponse complète
        return ResponseType.ANSWER
    
    async def _generate_response_content(
        self,
        email_content: str,
        email_subject: str,
        workspace_analysis: Dict[str, Any],
        response_type: ResponseType,
        tone: ResponseTone,
        language: Language,
        user_plan: str
    ) -> Dict[str, Any]:
        """Génère le contenu de la réponse avec IA"""
        
        # Instructions de ton
        tone_instructions = {
            ResponseTone.FORMAL: "Ton très formel, administratif, vouvoiement strict",
            ResponseTone.FRIENDLY: "Ton amical et chaleureux, vouvoiement bienveillant",
            ResponseTone.EMPATHETIC: "Ton empathique et rassurant, montrer compréhension",
            ResponseTone.PROFESSIONAL: "Ton professionnel neutre et clair",
            ResponseTone.CONCISE: "Réponse courte, aller à l'essentiel (max 5 lignes)",
            ResponseTone.DETAILED: "Réponse détaillée avec explications complètes"
        }
        
        # Instructions de type
        type_instructions = {
            ResponseType.ANSWER: "Répondre directement à la demande avec toutes les informations",
            ResponseType.REQUEST_INFO: "Demander poliment les informations manquantes",
            ResponseType.ACKNOWLEDGE: "Accuser réception et indiquer délai de traitement",
            ResponseType.FORWARD: "Expliquer transfert vers service compétent",
            ResponseType.APPOINTMENT: "Proposer rendez-vous avec créneaux disponibles",
            ResponseType.REJECTION: "Refuser poliment en expliquant les raisons"
        }
        
        prompt = f"""
        Génère une réponse email complète en {language.value.upper()}.
        
        EMAIL REÇU:
        Sujet: {email_subject}
        Contenu: {email_content[:500]}
        
        ANALYSE:
        - Priorité: {workspace_analysis.get('priority')}
        - Informations manquantes: {workspace_analysis.get('missing_info', [])}
        - Actions suggérées: {workspace_analysis.get('suggested_actions', [])}
        
        CONSIGNES:
        - Type de réponse: {type_instructions[response_type]}
        - Ton: {tone_instructions[tone]}
        - Langue: {language.value}
        - Longueur: {"courte" if tone == ResponseTone.CONCISE else "complète"}
        
        STRUCTURE ATTENDUE:
        1. Salutation adaptée
        2. Corps de la réponse
        3. Formule de politesse
        4. Signature
        
        FORMAT JSON:
        {{
            "greeting": "Bonjour Madame/Monsieur,",
            "body": "Paragraphes de réponse...",
            "closing": "Cordialement,",
            "signature": "Service Client IA Poste Manager",
            "ps": "Note additionnelle si nécessaire",
            "validation_reasons": ["raison si validation humaine nécessaire"]
        }}
        """
        
        # Utiliser IA selon plan utilisateur
        if user_plan in ['PREMIUM', 'PRO']:
            response = await self.ai_service.analyze_with_gpt4(prompt)
            response['ai_model'] = 'gpt-4'
        else:
            response = await self.ai_service.analyze_with_ollama(prompt)
            response['ai_model'] = 'ollama'
        
        return response
    
    def _apply_email_template(
        self,
        content: Dict[str, Any],
        tone: ResponseTone,
        language: Language,
        client_config: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Applique le template HTML/text pour email"""
        
        # Template text simple
        text_body = f"""{content['greeting']}

{content['body']}

{content['closing']}
{content['signature']}
"""
        
        if content.get('ps'):
            text_body += f"\nP.S. {content['ps']}"
        
        # Template HTML avec branding
        brand_color = client_config.get('brand_color', '#0066CC') if client_config else '#0066CC'
        
        html_body = f"""
<!DOCTYPE html>
<html lang="{language.value}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: {brand_color}; color: white; padding: 15px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f9f9f9; }}
        .footer {{ padding: 15px; text-align: center; font-size: 12px; color: #666; }}
        .signature {{ margin-top: 20px; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>IA Poste Manager</h2>
        </div>
        <div class="content">
            <p>{content['greeting']}</p>
            <div>{self._format_paragraphs_html(content['body'])}</div>
            <div class="signature">
                <p>{content['closing']}<br>
                {content['signature']}</p>
            </div>
            {f"<p><em>P.S. {content['ps']}</em></p>" if content.get('ps') else ''}
        </div>
        <div class="footer">
            <p>Cet email a été généré automatiquement par IA Poste Manager</p>
            <p>© 2025 IA Poste Manager - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
"""
        
        return {
            'text': text_body,
            'html': html_body,
            'attachments': content.get('attachments', []),
            'validation_reasons': content.get('validation_reasons', []),
            'ai_model': content.get('ai_model', 'ollama')
        }
    
    def _format_paragraphs_html(self, text: str) -> str:
        """Formate texte en paragraphes HTML"""
        paragraphs = text.split('\n\n')
        return ''.join(f'<p>{p.strip()}</p>' for p in paragraphs if p.strip())
    
    def _generate_subject(
        self,
        original_subject: str,
        response_type: ResponseType,
        language: Language
    ) -> str:
        """Génère le sujet de la réponse"""
        
        prefixes = {
            'fr': {
                ResponseType.ANSWER: 'Re:',
                ResponseType.REQUEST_INFO: 'Re: Informations complémentaires requises -',
                ResponseType.ACKNOWLEDGE: 'Re: Accusé de réception -',
                ResponseType.FORWARD: 'Re: Transfert de votre demande -',
                ResponseType.APPOINTMENT: 'Re: Proposition de rendez-vous -',
                ResponseType.REJECTION: 'Re:'
            },
            'en': {
                ResponseType.ANSWER: 'Re:',
                ResponseType.REQUEST_INFO: 'Re: Additional information required -',
                ResponseType.ACKNOWLEDGE: 'Re: Acknowledgment -',
                ResponseType.FORWARD: 'Re: Transfer of your request -',
                ResponseType.APPOINTMENT: 'Re: Meeting proposal -',
                ResponseType.REJECTION: 'Re:'
            }
        }
        
        prefix = prefixes.get(language.value, prefixes['fr']).get(
            response_type,
            'Re:'
        )
        
        # Nettoyer sujet original
        clean_subject = original_subject.replace('Re:', '').replace('RE:', '').strip()
        
        return f"{prefix} {clean_subject}"
    
    def _calculate_quality_score(
        self,
        response_content: Dict[str, Any],
        workspace_analysis: Dict[str, Any]
    ) -> float:
        """Calcule score de qualité de la réponse (0-10)"""
        
        score = 10.0
        
        # Pénalités
        body = response_content.get('body', '')
        
        # Réponse trop courte
        if len(body) < 100:
            score -= 2.0
        
        # Manque de salutation ou formule de politesse
        if not response_content.get('greeting'):
            score -= 1.5
        if not response_content.get('closing'):
            score -= 1.5
        
        # N'adresse pas les actions suggérées
        suggested_actions = workspace_analysis.get('suggested_actions', [])
        if suggested_actions:
            actions_mentioned = sum(
                1 for action in suggested_actions
                if any(word in body.lower() for word in action.lower().split()[:3])
            )
            if actions_mentioned < len(suggested_actions) / 2:
                score -= 2.0
        
        # Informations manquantes non mentionnées
        missing_info = workspace_analysis.get('missing_info', [])
        if missing_info and not any(info.lower() in body.lower() for info in missing_info):
            score -= 1.0
        
        return max(0.0, min(10.0, score))
    
    def _requires_human_validation(
        self,
        workspace_analysis: Dict[str, Any],
        quality_score: float,
        user_plan: str,
        client_config: Optional[Dict[str, Any]]
    ) -> bool:
        """Détermine si validation humaine nécessaire"""
        
        # Configuration client peut forcer validation
        if client_config and client_config.get('always_require_validation'):
            return True
        
        # Plan FREE: toujours valider
        if user_plan == 'FREE':
            return True
        
        # Score qualité faible
        if quality_score < 7.0:
            return True
        
        # Complexité élevée
        if workspace_analysis.get('analysis', {}).get('complexity_score', 0) >= 8:
            return True
        
        # Priorité urgente ou critique
        if workspace_analysis.get('priority') in ['urgent', 'critical']:
            return True
        
        # Type MDPH sensible
        if workspace_analysis.get('type') == 'mdph':
            return True
        
        # Plans PREMIUM/PRO avec bonne qualité: pas de validation
        if user_plan in ['PREMIUM', 'PRO'] and quality_score >= 8.0:
            return False
        
        return True
    
    def _generate_fallback_response(self, language: Language) -> Dict[str, Any]:
        """Génère réponse générique en cas d'erreur"""
        
        fallback_messages = {
            'fr': {
                'subject': 'Re: Accusé de réception',
                'body': "Nous avons bien reçu votre message et nous vous remercions de votre confiance. Notre équipe traite votre demande et vous recontactera dans les meilleurs délais."
            },
            'en': {
                'subject': 'Re: Acknowledgment',
                'body': "We have received your message and thank you for your trust. Our team is processing your request and will contact you as soon as possible."
            }
        }
        
        msg = fallback_messages.get(language.value, fallback_messages['fr'])
        
        return {
            'subject': msg['subject'],
            'body_text': msg['body'],
            'body_html': f"<p>{msg['body']}</p>",
            'attachments': [],
            'metadata': {
                'is_fallback': True,
                'generated_at': datetime.utcnow().isoformat()
            },
            'quality_score': 5.0,
            'requires_validation': True,
            'validation_reasons': ['Fallback response due to error']
        }
