"""
Module AdaptiveFormGenerator - Générateur de formulaires adaptatifs
Propriété: MS CONSEILS - Sarra Boudjellal
Version: 2.3 Production Ready
"""

from wtforms import Form, StringField, TextAreaField, SelectField, DateField, FileField, IntegerField, FloatField
from wtforms.validators import DataRequired, Email, Length, Optional, NumberRange, Regexp
from jinja2 import Template, Environment, BaseLoader
import json
import uuid
from datetime import datetime, date
from typing import Dict, List, Any, Optional
import logging
from dataclasses import dataclass, asdict

@dataclass
class FormField:
    """Structure d'un champ de formulaire"""
    id: str
    label: str
    type: str
    required: bool
    placeholder: str = ""
    aria_label: str = ""
    validation: Dict = None
    options: List[Dict] = None
    default_value: Any = None
    help_text: str = ""
    accessibility: Dict = None

@dataclass
class FormSchema:
    """Schéma complet d'un formulaire adaptatif"""
    form_id: str
    title: str
    description: str
    fields: List[FormField]
    accessibility: Dict
    validation_rules: Dict
    submit_action: str
    client_config: Dict = None

class AdaptiveFormGenerator:
    """Générateur de formulaires adaptatifs avec accessibilité complète"""
    
    def __init__(self, client_config: Dict = None):
        self.client_config = client_config or {}
        self.logger = self._setup_logger()
        
        # Templates de champs par type
        self.field_templates = self._load_field_templates()
        
        # Configuration d'accessibilité par défaut
        self.default_accessibility = {
            "screen_reader_support": True,
            "keyboard_navigation": True,
            "high_contrast": False,
            "font_size_adjustable": True,
            "voice_input_support": True,
            "aria_live_regions": True
        }
        
        # Règles de validation par type de champ
        self.validation_rules = {
            "email": {
                "type": "email",
                "pattern": r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                "message": "Veuillez saisir une adresse email valide"
            },
            "phone": {
                "pattern": r'^(?:\+33|0)[1-9](?:[0-9]{8})$',
                "message": "Veuillez saisir un numéro de téléphone français valide"
            },
            "order_id": {
                "pattern": r'^[A-Z0-9-]{5,20}$',
                "message": "Format de commande invalide (ex: CMD-2024-001234)"
            },
            "text": {
                "minLength": 2,
                "maxLength": 500,
                "message": "Le texte doit contenir entre 2 et 500 caractères"
            },
            "textarea": {
                "minLength": 10,
                "maxLength": 2000,
                "message": "La description doit contenir entre 10 et 2000 caractères"
            },
            "number": {
                "min": 0,
                "max": 999999,
                "message": "Veuillez saisir un nombre valide"
            }
        }
    
    def _setup_logger(self) -> logging.Logger:
        """Configure le logging"""
        logger = logging.getLogger("form_generator")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def generate_form_schema(self, missing_info: List[Dict], email_context: Dict) -> Dict:
        """
        Génère un schéma de formulaire adaptatif
        
        Args:
            missing_info: Liste des informations manquantes
            email_context: Contexte de l'email analysé
        
        Returns:
            Schéma de formulaire complet
        """
        try:
            form_id = str(uuid.uuid4())
            
            # Génération des champs adaptatifs
            fields = []
            for info in missing_info:
                field = self._create_adaptive_field(info, email_context)
                fields.append(field)
            
            # Ajout de champs contextuels automatiques
            contextual_fields = self._generate_contextual_fields(email_context)
            fields.extend(contextual_fields)
            
            # Configuration d'accessibilité
            accessibility_config = self._merge_accessibility_config()
            
            # Création du schéma
            schema = FormSchema(
                form_id=form_id,
                title=self._generate_form_title(email_context),
                description=self._generate_form_description(email_context),
                fields=fields,
                accessibility=accessibility_config,
                validation_rules=self._compile_validation_rules(fields),
                submit_action="complete_workspace",
                client_config=self.client_config
            )
            
            self.logger.info(f"Schéma de formulaire généré: {len(fields)} champs")
            
            return asdict(schema)
            
        except Exception as e:
            self.logger.error(f"Erreur génération schéma: {e}")
            return self._fallback_schema()
    
    def _create_adaptive_field(self, info: Dict, context: Dict) -> FormField:
        """Crée un champ adaptatif basé sur les informations manquantes"""
        field_type = info.get('type', 'text')
        field_id = info.get('field', f'field_{uuid.uuid4().hex[:8]}')
        
        # Configuration de base du champ
        field = FormField(
            id=field_id,
            label=info.get('label', field_id.replace('_', ' ').title()),
            type=field_type,
            required=info.get('required', True),
            placeholder=info.get('suggestion', ''),
            aria_label=self._generate_aria_label(info),
            validation=self._get_field_validation(field_type),
            help_text=self._generate_help_text(info, context)
        )
        
        # Personnalisation selon le type
        if field_type == 'select':
            field.options = self._generate_select_options(field_id, context)
        elif field_type == 'date':
            field.default_value = date.today().isoformat()
        elif field_type == 'number':
            field.validation.update({"step": "0.01"})
        
        # Configuration d'accessibilité spécifique
        field.accessibility = self._generate_field_accessibility(field_type, info)
        
        # Personnalisation client
        if self.client_config.get('form_customization', {}).get(field_id):
            client_custom = self.client_config['form_customization'][field_id]
            for key, value in client_custom.items():
                if hasattr(field, key):
                    setattr(field, key, value)
        
        return field
    
    def _generate_contextual_fields(self, context: Dict) -> List[FormField]:
        """Génère des champs contextuels basés sur l'analyse de l'email"""
        contextual_fields = []
        
        category = context.get('category', 'info')
        urgency = context.get('urgency', 'normal')
        
        # Champ de priorité si urgence détectée
        if urgency in ['high', 'critical']:
            priority_field = FormField(
                id='priority_confirmation',
                label='Confirmez-vous le caractère urgent de votre demande ?',
                type='select',
                required=True,
                options=[
                    {'value': 'urgent', 'label': 'Oui, c\'est urgent'},
                    {'value': 'normal', 'label': 'Non, priorité normale'},
                    {'value': 'low', 'label': 'Pas urgent'}
                ],
                aria_label='Sélection de la priorité de votre demande',
                help_text='Cette information nous aide à traiter votre demande avec la priorité appropriée'
            )
            contextual_fields.append(priority_field)
        
        # Champ de satisfaction pour les plaintes
        if category == 'complaint':
            satisfaction_field = FormField(
                id='satisfaction_level',
                label='Niveau de satisfaction actuel',
                type='select',
                required=False,
                options=[
                    {'value': '1', 'label': 'Très insatisfait'},
                    {'value': '2', 'label': 'Insatisfait'},
                    {'value': '3', 'label': 'Neutre'},
                    {'value': '4', 'label': 'Satisfait'},
                    {'value': '5', 'label': 'Très satisfait'}
                ],
                aria_label='Évaluation de votre niveau de satisfaction',
                help_text='Cette information nous aide à mieux comprendre votre situation'
            )
            contextual_fields.append(satisfaction_field)
        
        # Champ de méthode de contact préférée
        contact_method_field = FormField(
            id='preferred_contact_method',
            label='Méthode de contact préférée pour la réponse',
            type='select',
            required=True,
            options=[
                {'value': 'email', 'label': 'Email'},
                {'value': 'phone', 'label': 'Téléphone'},
                {'value': 'both', 'label': 'Email et téléphone'}
            ],
            default_value='email',
            aria_label='Sélection de votre méthode de contact préférée',
            help_text='Nous utiliserons cette méthode pour vous répondre'
        )
        contextual_fields.append(contact_method_field)
        
        return contextual_fields
    
    def _generate_form_title(self, context: Dict) -> str:
        """Génère un titre adaptatif pour le formulaire"""
        category = context.get('category', 'info')
        urgency = context.get('urgency', 'normal')
        
        titles = {
            'support': 'Informations complémentaires - Support technique',
            'commercial': 'Détails de votre projet commercial',
            'complaint': 'Informations sur votre réclamation',
            'request': 'Précisions sur votre demande',
            'info': 'Informations complémentaires'
        }
        
        base_title = titles.get(category, 'Informations complémentaires')
        
        if urgency == 'critical':
            base_title = f"🚨 URGENT - {base_title}"
        elif urgency == 'high':
            base_title = f"⚡ PRIORITAIRE - {base_title}"
        
        return base_title
    
    def _generate_form_description(self, context: Dict) -> str:
        """Génère une description adaptative pour le formulaire"""
        category = context.get('category', 'info')
        
        descriptions = {
            'support': 'Pour mieux vous aider à résoudre votre problème technique, merci de compléter les informations suivantes.',
            'commercial': 'Afin de vous proposer la meilleure offre adaptée à vos besoins, veuillez préciser les éléments ci-dessous.',
            'complaint': 'Nous prenons votre réclamation très au sérieux. Ces informations nous aideront à traiter votre demande rapidement.',
            'request': 'Pour traiter votre demande de manière optimale, nous avons besoin de quelques précisions.',
            'info': 'Merci de compléter ces informations pour que nous puissions vous renseigner au mieux.'
        }
        
        return descriptions.get(category, 'Merci de compléter ces informations pour mieux vous aider.')
    
    def _generate_aria_label(self, info: Dict) -> str:
        """Génère un label ARIA descriptif"""
        label = info.get('label', '')
        required = info.get('required', False)
        field_type = info.get('type', 'text')
        
        aria_label = f"Champ {label}"
        
        if required:
            aria_label += " obligatoire"
        else:
            aria_label += " optionnel"
        
        if field_type == 'textarea':
            aria_label += ", zone de texte multiligne"
        elif field_type == 'select':
            aria_label += ", liste de sélection"
        elif field_type == 'date':
            aria_label += ", sélecteur de date"
        
        return aria_label
    
    def _generate_help_text(self, info: Dict, context: Dict) -> str:
        """Génère un texte d'aide contextuel"""
        field_id = info.get('field', '')
        
        help_texts = {
            'order_id': 'Vous pouvez trouver ce numéro dans votre email de confirmation de commande',
            'contact_info': 'Nous utiliserons ces informations uniquement pour vous répondre',
            'problem_description': 'Plus votre description sera précise, plus nous pourrons vous aider efficacement',
            'budget': 'Cette information nous aide à vous proposer des solutions adaptées',
            'timeline': 'Indiquez votre date limite souhaitée pour ce projet',
            'incident_date': 'Date à laquelle le problème est survenu'
        }
        
        return help_texts.get(field_id, 'Veuillez remplir ce champ avec les informations demandées')
    
    def _generate_field_accessibility(self, field_type: str, info: Dict) -> Dict:
        """Génère la configuration d'accessibilité pour un champ"""
        accessibility = {
            "focusable": True,
            "keyboard_accessible": True,
            "screen_reader_friendly": True
        }
        
        if field_type == 'textarea':
            accessibility.update({
                "resize": "vertical",
                "spell_check": True,
                "auto_expand": True
            })
        elif field_type == 'select':
            accessibility.update({
                "searchable": True,
                "keyboard_navigation": True
            })
        elif field_type == 'date':
            accessibility.update({
                "date_picker_accessible": True,
                "keyboard_date_input": True
            })
        
        return accessibility
    
    def _generate_select_options(self, field_id: str, context: Dict) -> List[Dict]:
        """Génère les options pour les champs de sélection"""
        options_map = {
            'priority_confirmation': [
                {'value': 'urgent', 'label': 'Urgent'},
                {'value': 'normal', 'label': 'Normal'},
                {'value': 'low', 'label': 'Pas urgent'}
            ],
            'contact_preference': [
                {'value': 'email', 'label': 'Email'},
                {'value': 'phone', 'label': 'Téléphone'},
                {'value': 'sms', 'label': 'SMS'},
                {'value': 'postal', 'label': 'Courrier postal'}
            ],
            'satisfaction_level': [
                {'value': '1', 'label': 'Très insatisfait'},
                {'value': '2', 'label': 'Insatisfait'},
                {'value': '3', 'label': 'Neutre'},
                {'value': '4', 'label': 'Satisfait'},
                {'value': '5', 'label': 'Très satisfait'}
            ]
        }
        
        return options_map.get(field_id, [])
    
    def _merge_accessibility_config(self) -> Dict:
        """Fusionne la configuration d'accessibilité"""
        config = self.default_accessibility.copy()
        
        if self.client_config.get('accessibility'):
            config.update(self.client_config['accessibility'])
        
        return config
    
    def _get_field_validation(self, field_type: str) -> Dict:
        """Retourne les règles de validation pour un type de champ"""
        return self.validation_rules.get(field_type, {}).copy()
    
    def _compile_validation_rules(self, fields: List[FormField]) -> Dict:
        """Compile toutes les règles de validation du formulaire"""
        rules = {}
        
        for field in fields:
            if field.validation:
                rules[field.id] = field.validation
        
        return rules
    
    def _load_field_templates(self) -> Dict:
        """Charge les templates de champs"""
        return {
            "text": {
                "html_type": "text",
                "css_classes": ["form-input", "text-input"],
                "attributes": {"autocomplete": "off"}
            },
            "email": {
                "html_type": "email",
                "css_classes": ["form-input", "email-input"],
                "attributes": {"autocomplete": "email"}
            },
            "textarea": {
                "html_type": "textarea",
                "css_classes": ["form-textarea"],
                "attributes": {"rows": "4", "cols": "50"}
            },
            "select": {
                "html_type": "select",
                "css_classes": ["form-select"],
                "attributes": {}
            },
            "date": {
                "html_type": "date",
                "css_classes": ["form-input", "date-input"],
                "attributes": {}
            },
            "number": {
                "html_type": "number",
                "css_classes": ["form-input", "number-input"],
                "attributes": {"step": "any"}
            }
        }
    
    def _fallback_schema(self) -> Dict:
        """Schéma de formulaire de fallback"""
        return {
            "form_id": str(uuid.uuid4()),
            "title": "Informations complémentaires",
            "description": "Merci de compléter ces informations",
            "fields": [
                {
                    "id": "additional_info",
                    "label": "Informations complémentaires",
                    "type": "textarea",
                    "required": True,
                    "placeholder": "Veuillez préciser votre demande",
                    "aria_label": "Champ informations complémentaires obligatoire"
                }
            ],
            "accessibility": self.default_accessibility,
            "validation_rules": {
                "additional_info": {
                    "minLength": 10,
                    "message": "Veuillez saisir au moins 10 caractères"
                }
            },
            "submit_action": "complete_workspace",
            "fallback": True
        }

class FormValidator:
    """Validateur de formulaires avec règles personnalisées"""
    
    def __init__(self):
        self.logger = logging.getLogger("form_validator")
    
    def validate_form_data(self, form_data: Dict, form_schema: Dict) -> Dict:
        """
        Valide les données d'un formulaire
        
        Args:
            form_data: Données soumises
            form_schema: Schéma du formulaire
        
        Returns:
            Résultat de validation avec erreurs éventuelles
        """
        validation_result = {
            "is_valid": True,
            "errors": {},
            "warnings": [],
            "cleaned_data": {}
        }
        
        try:
            fields = form_schema.get('fields', [])
            validation_rules = form_schema.get('validation_rules', {})
            
            for field in fields:
                field_id = field['id']
                field_value = form_data.get(field_id)
                
                # Validation de champ
                field_validation = self._validate_field(
                    field_id, field_value, field, validation_rules.get(field_id, {})
                )
                
                if not field_validation['is_valid']:
                    validation_result['errors'][field_id] = field_validation['errors']
                    validation_result['is_valid'] = False
                else:
                    validation_result['cleaned_data'][field_id] = field_validation['cleaned_value']
            
            # Validations croisées
            cross_validation = self._cross_validate_fields(validation_result['cleaned_data'], form_schema)
            if cross_validation['warnings']:
                validation_result['warnings'].extend(cross_validation['warnings'])
            
            return validation_result
            
        except Exception as e:
            self.logger.error(f"Erreur validation formulaire: {e}")
            return {
                "is_valid": False,
                "errors": {"form": "Erreur de validation du formulaire"},
                "warnings": [],
                "cleaned_data": {}
            }
    
    def _validate_field(self, field_id: str, value: Any, field_config: Dict, validation_rules: Dict) -> Dict:
        """Valide un champ individuel"""
        result = {
            "is_valid": True,
            "errors": [],
            "cleaned_value": value
        }
        
        # Validation de présence pour champs obligatoires
        if field_config.get('required', False) and not value:
            result['is_valid'] = False
            result['errors'].append(f"Le champ {field_config.get('label', field_id)} est obligatoire")
            return result
        
        # Si pas de valeur et champ optionnel, pas de validation supplémentaire
        if not value:
            return result
        
        field_type = field_config.get('type', 'text')
        
        # Validation par type
        if field_type == 'email':
            if not self._validate_email(value):
                result['is_valid'] = False
                result['errors'].append("Format d'email invalide")
        
        elif field_type == 'phone':
            cleaned_phone = self._clean_phone_number(value)
            if not self._validate_phone(cleaned_phone):
                result['is_valid'] = False
                result['errors'].append("Numéro de téléphone invalide")
            else:
                result['cleaned_value'] = cleaned_phone
        
        elif field_type == 'number':
            try:
                numeric_value = float(value)
                if 'min' in validation_rules and numeric_value < validation_rules['min']:
                    result['is_valid'] = False
                    result['errors'].append(f"La valeur doit être supérieure à {validation_rules['min']}")
                if 'max' in validation_rules and numeric_value > validation_rules['max']:
                    result['is_valid'] = False
                    result['errors'].append(f"La valeur doit être inférieure à {validation_rules['max']}")
                result['cleaned_value'] = numeric_value
            except ValueError:
                result['is_valid'] = False
                result['errors'].append("Valeur numérique invalide")
        
        # Validation de longueur pour texte
        if field_type in ['text', 'textarea']:
            text_length = len(str(value))
            if 'minLength' in validation_rules and text_length < validation_rules['minLength']:
                result['is_valid'] = False
                result['errors'].append(f"Le texte doit contenir au moins {validation_rules['minLength']} caractères")
            if 'maxLength' in validation_rules and text_length > validation_rules['maxLength']:
                result['is_valid'] = False
                result['errors'].append(f"Le texte ne doit pas dépasser {validation_rules['maxLength']} caractères")
        
        # Validation de pattern
        if 'pattern' in validation_rules:
            import re
            if not re.match(validation_rules['pattern'], str(value)):
                result['is_valid'] = False
                result['errors'].append(validation_rules.get('message', 'Format invalide'))
        
        return result
    
    def _validate_email(self, email: str) -> bool:
        """Valide un email"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def _validate_phone(self, phone: str) -> bool:
        """Valide un numéro de téléphone français"""
        import re
        pattern = r'^(?:\+33|0)[1-9](?:[0-9]{8})$'
        return re.match(pattern, phone) is not None
    
    def _clean_phone_number(self, phone: str) -> str:
        """Nettoie un numéro de téléphone"""
        import re
        # Supprime tous les caractères non numériques sauf +
        cleaned = re.sub(r'[^\d+]', '', phone)
        
        # Normalise le format français
        if cleaned.startswith('0033'):
            cleaned = '+33' + cleaned[4:]
        elif cleaned.startswith('33') and not cleaned.startswith('+33'):
            cleaned = '+33' + cleaned[2:]
        
        return cleaned
    
    def _cross_validate_fields(self, data: Dict, schema: Dict) -> Dict:
        """Effectue des validations croisées entre champs"""
        warnings = []
        
        # Exemple: vérification cohérence email et téléphone
        if 'contact_info' in data and 'preferred_contact_method' in data:
            contact_method = data['preferred_contact_method']
            if contact_method == 'phone' and 'phone' not in data:
                warnings.append("Vous avez choisi le téléphone comme méthode de contact préférée mais n'avez pas fourni de numéro")
        
        return {"warnings": warnings}