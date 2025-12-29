"""
Module de simulation de pensée humaine pour IA Poste Manager

Génère des questions contextuelles qu'un humain poserait naturellement
pour compléter les informations manquantes détectées par l'analyse IA.

Fonctionnalités:
- Génération de questions simples et compréhensibles
- Adaptation au contexte (MDPH, administratif, général)
- Compatibilité accessibilité (langage clair, dyslexie-friendly)
- Multi-langue avec détection automatique
- Priorisation des questions selon importance
"""

import logging
import time
from typing import List, Dict, Any, Optional
from enum import Enum

from ..services.external_ai_service import ExternalAIService
from .logger import LoggerService

logger = logging.getLogger(__name__)


class QuestionType(str, Enum):
    """Types de questions selon la nature de l'information"""
    IDENTITY = "identity"  # Nom, prénom, adresse
    DATES = "dates"  # Dates importantes, échéances
    ADMINISTRATIVE = "administrative"  # Numéros administratifs
    MEDICAL = "medical"  # Informations médicales (MDPH)
    FINANCIAL = "financial"  # Informations financières
    CONTACT = "contact"  # Coordonnées
    CONTEXT = "context"  # Contexte de la demande
    DOCUMENTS = "documents"  # Documents manquants


class QuestionPriority(str, Enum):
    """Priorité des questions"""
    CRITICAL = "critical"  # Bloquant
    HIGH = "high"  # Très important
    MEDIUM = "medium"  # Important
    LOW = "low"  # Optionnel


class HumanThoughtSimulator:
    """Simulateur de questions humaines contextuelles"""
    
    def __init__(self):
        self.ai_service = ExternalAIService()
        self.logger = LoggerService()
    
    async def generate_questions(
        self,
        missing_info: List[str],
        email_content: str,
        workspace_type: str,
        user_language: str = "fr",
        accessibility_mode: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Génère des questions humaines à partir des informations manquantes

        Args:
            missing_info: Liste des informations manquantes détectées
            email_content: Contenu original de l'email
            workspace_type: Type de workspace (MDPH, administratif, etc.)
            user_language: Langue de l'utilisateur (fr, en, es, ar)
            accessibility_mode: Mode d'accessibilité (dyslexie, malvoyant, etc.)

        Returns:
            Liste de questions avec métadonnées:
            [
                {
                    'question': str,
                    'type': QuestionType,
                    'priority': QuestionPriority,
                    'context': str,
                    'field_type': str,  # text, date, number, select
                    'validation_rules': dict,
                    'help_text': str
                }
            ]
        """
        start_time = time.time()
        try:
            questions = []

            # Log start of question generation
            self.logger.log_workspace_event(
                workspace_id="human_thought_sim",
                event_type="question_generation_start",
                metadata={
                    "missing_info_count": len(missing_info),
                    "workspace_type": workspace_type,
                    "user_language": user_language,
                    "accessibility_mode": accessibility_mode
                }
            )

            # 1. Générer questions avec IA selon contexte
            ai_questions = await self._generate_ai_questions(
                missing_info=missing_info,
                email_content=email_content,
                workspace_type=workspace_type,
                user_language=user_language
            )

            # 2. Adapter les questions selon accessibilité
            if accessibility_mode:
                ai_questions = self._adapt_for_accessibility(
                    questions=ai_questions,
                    mode=accessibility_mode
                )

            # 3. Prioriser les questions
            prioritized_questions = self._prioritize_questions(
                questions=ai_questions,
                workspace_type=workspace_type
            )

            # 4. Ajouter métadonnées et validation
            for q in prioritized_questions:
                questions.append(self._enrich_question(q))

            # Log successful completion
            execution_time = time.time() - start_time
            self.logger.log_workspace_event(
                workspace_id="human_thought_sim",
                event_type="question_generation_complete",
                metadata={
                    "questions_generated": len(questions),
                    "execution_time": execution_time,
                    "workspace_type": workspace_type
                }
            )

            return questions

        except Exception as e:
            # Log error
            execution_time = time.time() - start_time
            self.logger.log_workspace_event(
                workspace_id="human_thought_sim",
                event_type="question_generation_error",
                metadata={
                    "error": str(e),
                    "execution_time": execution_time,
                    "missing_info_count": len(missing_info)
                }
            )
            logger.error(f"Error generating questions: {str(e)}")
            # Fallback: questions basiques
            return self._generate_fallback_questions(missing_info)
    
    async def _generate_ai_questions(
        self,
        missing_info: List[str],
        email_content: str,
        workspace_type: str,
        user_language: str
    ) -> List[Dict[str, Any]]:
        """Génère questions avec IA locale (Ollama)"""
        
        # Contexte MDPH spécifique
        mdph_context = ""
        if workspace_type == "mdph":
            mdph_context = """
            Contexte MDPH: Questions pour formulaire de demande MDPH (AAH, PCH, RQTH, CMI).
            Poser questions simples, empathiques, sans jargon médical.
            Privilégier questions ouvertes pour impact fonctionnel du handicap.
            """
        
        prompt = f"""
        Génère des questions humaines naturelles pour compléter ces informations manquantes.
        
        INFORMATIONS MANQUANTES: {', '.join(missing_info)}
        
        CONTEXTE EMAIL:
        {email_content[:500]}
        
        TYPE: {workspace_type}
        {mdph_context}
        LANGUE: {user_language}
        
        Pour chaque information manquante, génère:
        - Une question claire et empathique
        - Le type d'information attendue (texte, date, numéro, etc.)
        - Une priorité (critique/haute/moyenne/basse)
        - Un texte d'aide optionnel
        
        Format JSON:
        [
            {{
                "question": "Quelle est votre date de naissance ?",
                "missing_field": "date_naissance",
                "type": "dates",
                "priority": "critical",
                "field_type": "date",
                "help_text": "Format: JJ/MM/AAAA",
                "context": "Nécessaire pour votre dossier administratif"
            }}
        ]
        
        IMPORTANT:
        - Questions courtes (max 15 mots)
        - Langage simple (niveau A2)
        - Pas de jargon administratif
        - Empathiques et bienveillantes
        """
        
        response = await self.ai_service.analyze_with_ollama(prompt)
        
        # Parser la réponse IA (supposant format JSON)
        if isinstance(response, dict) and 'questions' in response:
            return response['questions']
        elif isinstance(response, list):
            return response
        else:
            logger.warning(f"Unexpected AI response format: {type(response)}")
            return []
    
    def _adapt_for_accessibility(
        self,
        questions: List[Dict[str, Any]],
        mode: str
    ) -> List[Dict[str, Any]]:
        """Adapte les questions selon le mode d'accessibilité"""
        
        if mode == "dyslexie":
            # Questions plus courtes, mots simples
            for q in questions:
                q['question'] = self._simplify_for_dyslexia(q['question'])
                if 'help_text' in q:
                    q['help_text'] = self._simplify_for_dyslexia(q['help_text'])
        
        elif mode == "deficience_intellectuelle":
            # Questions très simples, avec exemples
            for q in questions:
                q['question'] = self._simplify_language(q['question'])
                q['example'] = self._add_example(q)
        
        elif mode == "malvoyant":
            # Textes descriptifs pour lecteur d'écran
            for q in questions:
                q['aria_label'] = f"Question {questions.index(q) + 1} sur {len(questions)}: {q['question']}"
        
        return questions
    
    def _simplify_for_dyslexia(self, text: str) -> str:
        """Simplifie le texte pour personnes dyslexiques"""
        # Remplacer mots complexes
        replacements = {
            'nécessaire': 'il faut',
            'administratif': 'papiers officiels',
            'ultérieur': 'plus tard',
            'conjointement': 'ensemble',
            'antérieurement': 'avant'
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        # Limiter longueur phrase
        if len(text.split()) > 12:
            # Couper en phrases plus courtes
            text = '. '.join([
                ' '.join(text.split()[:12]),
                ' '.join(text.split()[12:])
            ])
        
        return text
    
    def _simplify_language(self, text: str) -> str:
        """Simplifie langage niveau très accessible (FALC - Facile À Lire et Comprendre)"""
        # Simplifications FALC
        text = text.replace('?', ' ?')  # Espaces avant ponctuation
        text = text.replace('Quelle est', 'Quel est')
        text = text.replace('Pourriez-vous', 'Pouvez-vous')
        return text
    
    def _add_example(self, question_data: Dict[str, Any]) -> str:
        """Ajoute un exemple concret à la question"""
        examples = {
            'dates': 'Par exemple: 15 janvier 2020',
            'identity': 'Par exemple: Martin Dupont',
            'contact': 'Par exemple: 06 12 34 56 78',
            'administrative': 'Par exemple: 1 23 45 67 890 123 45'
        }
        
        return examples.get(question_data.get('type'), '')
    
    def _prioritize_questions(
        self,
        questions: List[Dict[str, Any]],
        workspace_type: str
    ) -> List[Dict[str, Any]]:
        """Priorise les questions selon importance"""
        
        # Règles de priorisation MDPH
        if workspace_type == "mdph":
            critical_keywords = ['identité', 'date naissance', 'sécurité sociale']
            high_keywords = ['handicap', 'médecin', 'allocation']
        else:
            critical_keywords = ['nom', 'prénom', 'référence']
            high_keywords = ['date', 'montant', 'adresse']
        
        for q in questions:
            question_text = q.get('question', '').lower()
            
            # Déterminer priorité
            if any(kw in question_text for kw in critical_keywords):
                q['priority'] = QuestionPriority.CRITICAL
            elif any(kw in question_text for kw in high_keywords):
                q['priority'] = QuestionPriority.HIGH
            elif 'optionnel' in question_text or 'si possible' in question_text:
                q['priority'] = QuestionPriority.LOW
            else:
                q['priority'] = QuestionPriority.MEDIUM
        
        # Trier par priorité
        priority_order = {
            QuestionPriority.CRITICAL: 0,
            QuestionPriority.HIGH: 1,
            QuestionPriority.MEDIUM: 2,
            QuestionPriority.LOW: 3
        }
        
        return sorted(
            questions,
            key=lambda q: priority_order.get(q.get('priority', QuestionPriority.MEDIUM), 2)
        )
    
    def _enrich_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enrichit la question avec métadonnées et validation"""
        
        field_type = question_data.get('field_type', 'text')
        
        # Règles de validation selon type
        validation_rules = {
            'text': {'min_length': 2, 'max_length': 200},
            'date': {'format': 'DD/MM/YYYY', 'min_age': 0, 'max_age': 120},
            'email': {'regex': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'},
            'phone': {'regex': r'^0[1-9](\d{2}){4}$', 'format': '0X XX XX XX XX'},
            'number': {'min': 0, 'max': 999999},
            'secu': {'regex': r'^\d{15}$', 'format': '1 23 45 67 890 123 45'}
        }
        
        question_data['validation_rules'] = validation_rules.get(field_type, {})
        
        # Ajouter placeholder
        placeholders = {
            'date': 'JJ/MM/AAAA',
            'email': 'votre.email@exemple.fr',
            'phone': '06 12 34 56 78',
            'secu': '1 23 45 67 890 123 45',
            'text': ''
        }
        question_data['placeholder'] = placeholders.get(field_type, '')
        
        return question_data
    
    def _generate_fallback_questions(
        self,
        missing_info: List[str]
    ) -> List[Dict[str, Any]]:
        """Génère questions basiques en cas d'erreur IA"""
        questions = []
        
        for info in missing_info:
            # Questions génériques
            question_text = f"Pouvez-vous nous fournir: {info} ?"
            
            questions.append({
                'question': question_text,
                'missing_field': info.lower().replace(' ', '_'),
                'type': QuestionType.CONTEXT,
                'priority': QuestionPriority.MEDIUM,
                'field_type': 'text',
                'help_text': 'Cette information est nécessaire pour traiter votre demande.',
                'validation_rules': {'min_length': 1}
            })
        
        return questions
    
    async def generate_mdph_specific_questions(
        self,
        form_type: str,
        existing_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Génère questions spécifiques MDPH selon type de formulaire
        
        Args:
            form_type: Type formulaire (demande_aah, demande_pch, etc.)
            existing_data: Données déjà renseignées
            
        Returns:
            Questions spécifiques MDPH
        """
        
        mdph_questions_templates = {
            'demande_aah': [
                {
                    'question': 'Quelle est la nature principale de votre handicap ?',
                    'type': QuestionType.MEDICAL,
                    'priority': QuestionPriority.CRITICAL,
                    'field_type': 'select',
                    'options': [
                        'Handicap moteur',
                        'Handicap sensoriel (vue/ouïe)',
                        'Handicap psychique',
                        'Handicap intellectuel',
                        'Maladie invalidante',
                        'Autre'
                    ],
                    'help_text': 'Sélectionnez le handicap qui vous impacte le plus au quotidien'
                },
                {
                    'question': 'Depuis quand vivez-vous avec ce handicap ?',
                    'type': QuestionType.DATES,
                    'priority': QuestionPriority.HIGH,
                    'field_type': 'date',
                    'help_text': 'Si vous ne connaissez pas la date exacte, indiquez approximativement'
                },
                {
                    'question': 'Avez-vous un médecin référent pour votre handicap ?',
                    'type': QuestionType.MEDICAL,
                    'priority': QuestionPriority.HIGH,
                    'field_type': 'text',
                    'help_text': 'Nom et coordonnées de votre médecin traitant ou spécialiste'
                }
            ],
            'demande_pch': [
                {
                    'question': 'De combien d\'heures d\'aide humaine avez-vous besoin par semaine ?',
                    'type': QuestionType.CONTEXT,
                    'priority': QuestionPriority.CRITICAL,
                    'field_type': 'number',
                    'validation_rules': {'min': 1, 'max': 168},
                    'help_text': 'Pour les actes essentiels de la vie quotidienne (toilette, repas, déplacements...)'
                }
            ]
        }
        
        questions = mdph_questions_templates.get(form_type, [])
        
        # Filtrer questions déjà répondues
        filtered_questions = [
            q for q in questions
            if q.get('missing_field') not in existing_data
        ]
        
        return filtered_questions
