"""
Générateur de formulaires interactifs adaptatifs pour IA Poste Manager

Fonctionnalités:
- Formulaires accessibles (5 modes RGAA AAA)
- Compatible MDPH avec pré-remplissage intelligent
- Validation multi-étapes avec sauvegarde auto
- Multi-langue avec RTL pour arabe
- Génération dynamique selon contexte
"""

import logging
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)

# Import LoggerService
from .logger import LoggerService


class FormFieldType(str, Enum):
    """Types de champs de formulaire"""
    TEXT = "text"
    TEXTAREA = "textarea"
    EMAIL = "email"
    PHONE = "phone"
    DATE = "date"
    NUMBER = "number"
    SELECT = "select"
    RADIO = "radio"
    CHECKBOX = "checkbox"
    FILE = "file"
    SIGNATURE = "signature"
    SECU = "secu"  # Numéro sécurité sociale
    IBAN = "iban"


class AccessibilityMode(str, Enum):
    """Modes d'accessibilité RGAA"""
    MALVOYANT = "malvoyant"
    DEFICIENCE_MOTRICE = "deficience_motrice"
    DYSLEXIE = "dyslexie"
    DEFICIENCE_AUDITIVE = "deficience_auditive"
    DEFICIENCE_INTELLECTUELLE = "deficience_intellectuelle"


class FormGenerator:
    """Générateur de formulaires adaptatifs"""
    
    def __init__(self):
        self.forms_cache = {}
        self.logger = LoggerService()
    
    def generate_form(
        self,
        questions: List[Dict[str, Any]],
        form_type: str = "general",
        accessibility_mode: Optional[AccessibilityMode] = None,
        language: str = "fr",
        user_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Génère un formulaire interactif adaptatif

        Args:
            questions: Liste de questions générées par HumanThoughtSimulator
            form_type: Type de formulaire (general, mdph, administrative)
            accessibility_mode: Mode d'accessibilité activé
            language: Langue du formulaire (fr, en, es, ar)
            user_data: Données utilisateur pour pré-remplissage

        Returns:
            Structure complète du formulaire avec métadonnées, champs, validation
        """

        start_time = datetime.utcnow()
        self.logger.log_event(
            'form_generation_started',
            {
                'form_type': form_type,
                'accessibility_mode': accessibility_mode.value if accessibility_mode else None,
                'language': language,
                'questions_count': len(questions)
            }
        )

        form_id = str(uuid.uuid4())

        try:
            # 1. Organiser questions en étapes logiques
            steps = self._organize_into_steps(questions, form_type)

            # 2. Générer champs pour chaque étape
            for step in steps:
                step['fields'] = [
                    self._generate_field(q, accessibility_mode, language, user_data)
                    for q in step['questions']
                ]

            # 3. Appliquer adaptations accessibilité
            if accessibility_mode:
                steps = self._apply_accessibility_adaptations(steps, accessibility_mode)
                self.logger.log_event(
                    'accessibility_mode_applied',
                    {'mode': accessibility_mode.value, 'form_id': form_id}
                )

            # 4. Configurer validation et sauvegarde auto
            form_config = self._generate_form_config(form_type, accessibility_mode, language)

            form_structure = {
                'id': form_id,
                'type': form_type,
                'language': language,
                'accessibility_mode': accessibility_mode.value if accessibility_mode else None,
                'created_at': datetime.utcnow().isoformat(),
                'steps': steps,
                'config': form_config,
                'progress_tracking': {
                    'current_step': 0,
                    'completed_steps': [],
                    'total_steps': len(steps),
                    'completion_percentage': 0
                },
                'auto_save': {
                    'enabled': True,
                    'interval_seconds': 30,
                    'last_saved_at': None
                }
            }

            # Mettre en cache
            self.forms_cache[form_id] = form_structure

            # Log performance
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            self.logger.log_performance(
                'form_generation',
                duration,
                {
                    'form_id': form_id,
                    'form_type': form_type,
                    'steps_count': len(steps),
                    'fields_count': sum(len(step.get('fields', [])) for step in steps)
                }
            )

            self.logger.log_event(
                'form_generation_completed',
                {
                    'form_id': form_id,
                    'form_type': form_type,
                    'steps_count': len(steps),
                    'duration_seconds': duration
                }
            )

            return form_structure

        except Exception as e:
            self.logger.log_error(
                'form_generation_failed',
                str(e),
                {
                    'form_type': form_type,
                    'accessibility_mode': accessibility_mode.value if accessibility_mode else None,
                    'language': language,
                    'questions_count': len(questions)
                }
            )
            raise
    
    def _organize_into_steps(
        self,
        questions: List[Dict[str, Any]],
        form_type: str
    ) -> List[Dict[str, Any]]:
        """Organise les questions en étapes logiques"""
        
        if form_type == "mdph":
            # Organisation spécifique MDPH
            return self._organize_mdph_steps(questions)
        
        # Organisation générique par type de question
        steps_mapping = {
            'identity': 'Identité',
            'contact': 'Coordonnées',
            'administrative': 'Informations administratives',
            'medical': 'Informations médicales',
            'financial': 'Informations financières',
            'context': 'Contexte de la demande',
            'documents': 'Documents justificatifs'
        }
        
        steps = []
        grouped_questions = {}
        
        # Grouper questions par type
        for q in questions:
            q_type = q.get('type', 'context')
            if q_type not in grouped_questions:
                grouped_questions[q_type] = []
            grouped_questions[q_type].append(q)
        
        # Créer étapes
        step_order = ['identity', 'contact', 'administrative', 'medical', 'financial', 'context', 'documents']
        
        for q_type in step_order:
            if q_type in grouped_questions:
                steps.append({
                    'id': f"step_{len(steps) + 1}",
                    'title': steps_mapping.get(q_type, 'Informations'),
                    'description': self._get_step_description(q_type),
                    'questions': grouped_questions[q_type],
                    'is_optional': q_type in ['documents', 'financial'],
                    'estimated_time_minutes': len(grouped_questions[q_type]) * 2
                })
        
        return steps
    
    def _organize_mdph_steps(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Organisation spécifique pour formulaires MDPH"""
        
        mdph_steps = [
            {
                'id': 'step_1',
                'title': 'Votre identité',
                'description': 'Informations personnelles nécessaires à votre dossier MDPH',
                'icon': 'user',
                'questions': [q for q in questions if q.get('type') == 'identity'],
                'is_optional': False,
                'estimated_time_minutes': 3
            },
            {
                'id': 'step_2',
                'title': 'Votre situation de handicap',
                'description': 'Description de votre handicap et de son impact au quotidien',
                'icon': 'medical',
                'questions': [q for q in questions if q.get('type') == 'medical'],
                'is_optional': False,
                'estimated_time_minutes': 10,
                'help_text': 'Décrivez concrètement les difficultés rencontrées dans votre vie quotidienne'
            },
            {
                'id': 'step_3',
                'title': 'Vos besoins',
                'description': 'Aidez-nous à comprendre vos besoins spécifiques',
                'icon': 'heart',
                'questions': [q for q in questions if q.get('type') == 'context'],
                'is_optional': False,
                'estimated_time_minutes': 8
            },
            {
                'id': 'step_4',
                'title': 'Documents justificatifs',
                'description': 'Certificats médicaux, justificatifs d\'identité et de domicile',
                'icon': 'file',
                'questions': [q for q in questions if q.get('type') == 'documents'],
                'is_optional': True,
                'estimated_time_minutes': 5,
                'help_text': 'Vous pourrez ajouter les documents plus tard si vous ne les avez pas maintenant'
            }
        ]
        
        # Filtrer étapes vides
        return [step for step in mdph_steps if step['questions']]
    
    def _get_step_description(self, question_type: str) -> str:
        """Descriptions des étapes"""
        descriptions = {
            'identity': 'Vos informations personnelles',
            'contact': 'Comment vous joindre',
            'administrative': 'Références et numéros administratifs',
            'medical': 'Informations de santé (confidentielles)',
            'financial': 'Informations financières si nécessaire',
            'context': 'Expliquez-nous votre situation',
            'documents': 'Pièces justificatives à joindre'
        }
        return descriptions.get(question_type, '')
    
    def _generate_field(
        self,
        question: Dict[str, Any],
        accessibility_mode: Optional[AccessibilityMode],
        language: str,
        user_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Génère un champ de formulaire complet"""
        
        field_id = question.get('missing_field', str(uuid.uuid4()))
        field_type = question.get('field_type', FormFieldType.TEXT)
        
        field = {
            'id': field_id,
            'type': field_type,
            'label': question.get('question'),
            'required': question.get('priority') in ['critical', 'high'],
            'placeholder': question.get('placeholder', ''),
            'help_text': question.get('help_text', ''),
            'validation': question.get('validation_rules', {}),
            'default_value': self._get_default_value(field_id, user_data),
            'aria_label': question.get('aria_label', question.get('question')),
            'autocomplete': self._get_autocomplete_attr(field_id)
        }
        
        # Ajouter options pour select/radio
        if 'options' in question:
            field['options'] = question['options']
        
        # Exemple si disponible
        if 'example' in question:
            field['example'] = question['example']
        
        # Adaptations accessibilité
        if accessibility_mode == AccessibilityMode.MALVOYANT:
            field['high_contrast'] = True
            field['font_size_multiplier'] = 1.5
            field['screen_reader_optimized'] = True
        
        elif accessibility_mode == AccessibilityMode.DEFICIENCE_MOTRICE:
            field['large_click_area'] = True
            field['keyboard_shortcut'] = f"Alt+{hash(field_id) % 9 + 1}"
            field['voice_input_enabled'] = True
        
        elif accessibility_mode == AccessibilityMode.DYSLEXIE:
            field['font_family'] = 'OpenDyslexic'
            field['line_spacing'] = 1.8
            field['word_spacing'] = 1.2
        
        elif accessibility_mode == AccessibilityMode.DEFICIENCE_INTELLECTUELLE:
            field['pictogram'] = self._get_pictogram(field_id)
            field['simplified_label'] = self._simplify_text(field['label'])
            field['example_always_visible'] = True
        
        return field
    
    def _get_default_value(
        self,
        field_id: str,
        user_data: Optional[Dict[str, Any]]
    ) -> Optional[Any]:
        """Récupère valeur par défaut depuis données utilisateur"""
        if not user_data:
            return None
        
        # Mapping champs → données user
        field_mapping = {
            'nom': 'last_name',
            'prenom': 'first_name',
            'email': 'email',
            'telephone': 'phone',
            'date_naissance': 'birth_date',
            'adresse': 'address',
            'code_postal': 'postal_code',
            'ville': 'city'
        }
        
        user_field = field_mapping.get(field_id)
        return user_data.get(user_field) if user_field else None
    
    def _get_autocomplete_attr(self, field_id: str) -> str:
        """Attribut autocomplete HTML pour navigateurs"""
        autocomplete_mapping = {
            'nom': 'family-name',
            'prenom': 'given-name',
            'email': 'email',
            'telephone': 'tel',
            'date_naissance': 'bday',
            'adresse': 'street-address',
            'code_postal': 'postal-code',
            'ville': 'address-level2',
            'pays': 'country-name'
        }
        return autocomplete_mapping.get(field_id, 'off')
    
    def _get_pictogram(self, field_id: str) -> str:
        """Pictogramme pour déficience intellectuelle (FALC)"""
        pictograms = {
            'nom': '👤',
            'prenom': '👤',
            'email': '📧',
            'telephone': '📱',
            'date_naissance': '🎂',
            'adresse': '🏠',
            'handicap': '♿',
            'medecin': '👨‍⚕️',
            'aide': '🤝',
            'document': '📄'
        }
        return pictograms.get(field_id, '📝')
    
    def _simplify_text(self, text: str) -> str:
        """Simplifie texte pour déficience intellectuelle"""
        replacements = {
            'Quelle est votre': 'Votre',
            'Pouvez-vous indiquer': 'Votre',
            'adresse électronique': 'e-mail',
            'numéro de téléphone': 'téléphone',
            'date de naissance': 'date de naissance'
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text
    
    def _apply_accessibility_adaptations(
        self,
        steps: List[Dict[str, Any]],
        mode: AccessibilityMode
    ) -> List[Dict[str, Any]]:
        """Applique adaptations globales au formulaire"""
        
        for step in steps:
            # Mode malvoyant: un champ par page
            if mode == AccessibilityMode.MALVOYANT:
                step['single_field_per_screen'] = True
                step['high_contrast_theme'] = True
            
            # Mode déficience motrice: navigation clavier optimisée
            elif mode == AccessibilityMode.DEFICIENCE_MOTRICE:
                step['keyboard_navigation_enhanced'] = True
                step['auto_focus_next_field'] = True
            
            # Mode dyslexie: espacement augmenté
            elif mode == AccessibilityMode.DYSLEXIE:
                step['increased_spacing'] = True
                step['dyslexia_friendly_font'] = True
            
            # Mode déficience intellectuelle: progression visuelle
            elif mode == AccessibilityMode.DEFICIENCE_INTELLECTUELLE:
                step['visual_progress_bar'] = True
                step['celebration_on_completion'] = True
                step['pictograms_enabled'] = True
        
        return steps
    
    def _generate_form_config(
        self,
        form_type: str,
        accessibility_mode: Optional[AccessibilityMode],
        language: str
    ) -> Dict[str, Any]:
        """Configuration globale du formulaire"""
        
        config = {
            'validation': {
                'validate_on_blur': True,
                'validate_on_change': False,
                'show_errors_inline': True,
                'error_summary_at_top': accessibility_mode == AccessibilityMode.MALVOYANT
            },
            'auto_save': {
                'enabled': True,
                'interval_seconds': 30,
                'save_to': 'local_storage',  # ou 'server'
                'show_save_indicator': True
            },
            'navigation': {
                'show_progress': True,
                'allow_skip_optional': True,
                'confirm_before_exit': True
            },
            'submission': {
                'confirm_before_submit': True,
                'show_summary_before_submit': True,
                'allow_save_as_draft': True
            },
            'language': {
                'code': language,
                'direction': 'rtl' if language == 'ar' else 'ltr',
                'date_format': self._get_date_format(language)
            }
        }
        
        # Configuration MDPH spécifique
        if form_type == "mdph":
            config['mdph'] = {
                'show_help_videos': True,
                'show_example_forms': True,
                'enable_phone_support': True,
                'support_phone': '0800 360 360',  # Numéro vert MDPH
                'show_completion_estimate': True
            }
        
        return config
    
    def _get_date_format(self, language: str) -> str:
        """Format de date selon langue"""
        formats = {
            'fr': 'DD/MM/YYYY',
            'en': 'MM/DD/YYYY',
            'es': 'DD/MM/YYYY',
            'ar': 'DD/MM/YYYY'
        }
        return formats.get(language, 'DD/MM/YYYY')
    
    def generate_mdph_form_cerfa(
        self,
        form_data: Dict[str, Any],
        form_type: str = "cerfa_15692"
    ) -> Dict[str, Any]:
        """
        Génère un formulaire MDPH officiel (CERFA) pré-rempli
        
        Args:
            form_data: Données collectées via formulaire adaptatif
            form_type: Type de CERFA (15692 pour demande MDPH)
            
        Returns:
            Structure CERFA avec mapping des champs
        """
        
        cerfa_mapping = {
            'nom': 'beneficiaire_nom',
            'prenom': 'beneficiaire_prenom',
            'date_naissance': 'beneficiaire_date_naissance',
            'secu': 'numero_securite_sociale',
            'adresse': 'adresse_complete',
            'telephone': 'telephone',
            'email': 'email'
        }
        
        cerfa_data = {
            'cerfa_number': form_type,
            'cerfa_version': '01',
            'generated_at': datetime.utcnow().isoformat(),
            'fields': {}
        }
        
        # Mapper données utilisateur → champs CERFA
        for user_field, cerfa_field in cerfa_mapping.items():
            if user_field in form_data:
                cerfa_data['fields'][cerfa_field] = form_data[user_field]
        
        return cerfa_data
