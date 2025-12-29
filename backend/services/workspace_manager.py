"""
Module WorkspaceManager - Gestion centralisée des workspaces IA
Propriété: MS CONSEILS - Sarra Boudjellal
Version: 2.3 Production Ready
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from cryptography.fernet import Fernet
import openai
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import re
import hashlib

Base = declarative_base()

class Workspace(Base):
    """Modèle de données Workspace pour PostgreSQL"""
    __tablename__ = 'workspaces'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, nullable=False, index=True)
    email_data_encrypted = Column(Text, nullable=False)
    analysis_result = Column(JSON)
    missing_info = Column(JSON)
    generated_form = Column(JSON)
    ai_response = Column(Text)
    priority = Column(String, default='normal', index=True)
    status = Column(String, default='created', index=True)
    language = Column(String, default='fr')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WorkspaceManager:
    """Gestionnaire principal des workspaces avec IA intégrée"""
    
    def __init__(self, db_session, openai_key: str, encryption_key: str):
        self.db = db_session
        self.openai_client = openai.OpenAI(api_key=openai_key)
        self.cipher = Fernet(encryption_key.encode())
        self.logger = self._setup_logger()
        
        self.ai_config = {
            "model": "gpt-4",
            "temperature": 0.7,
            "max_tokens": 1000,
            "timeout": 30
        }
        
        self.info_patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b(?:\+33|0)[1-9](?:[0-9]{8})\b',
            "order_id": r'\b(?:commande|order|cmd)[\s#:]*([A-Z0-9]{3,})\b',
            "amount": r'\b(\d+(?:[.,]\d{2})?)\s*€?\b',
            "date": r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
        }
    
    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger("workspace_manager")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def create_workspace(self, email_data: Dict, client_id: str, priority: str = "normal") -> Dict:
        """Crée un nouveau workspace à partir des données email"""
        try:
            if not self._validate_email_data(email_data):
                raise ValueError("Données email invalides")
            
            if priority not in ["low", "normal", "high", "critical"]:
                priority = "normal"
            
            workspace_id = str(uuid.uuid4())
            encrypted_email_data = self._encrypt_sensitive_data(email_data)
            
            analysis_result = self.analyze_email_content(
                email_data.get('content', ''),
                email_data.get('attachments', [])
            )
            
            missing_info = self.detect_missing_info(analysis_result, email_data)
            
            workspace = Workspace(
                id=workspace_id,
                client_id=client_id,
                email_data_encrypted=encrypted_email_data,
                analysis_result=analysis_result,
                missing_info=missing_info,
                priority=priority,
                status='analyzing',
                language=analysis_result.get('language', 'fr')
            )
            
            self.db.add(workspace)
            self.db.commit()
            
            self.logger.info(f"Workspace créé: {workspace_id[:8]}... pour client {client_id}")
            
            return {
                "status": "success",
                "workspace_id": workspace_id,
                "priority": priority,
                "analysis": analysis_result,
                "missing_info": missing_info,
                "created_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Erreur création workspace: {str(e)}")
            self.db.rollback()
            return {
                "status": "error",
                "message": str(e),
                "error_code": "WORKSPACE_CREATION_FAILED"
            }
    
    def analyze_email_content(self, content: str, attachments: List = None) -> Dict:
        """Analyse le contenu email avec IA OpenAI"""
        try:
            analysis_prompt = f"""
            Analyse cet email professionnel en français et fournis une analyse JSON structurée:
            
            Email: {content[:2000]}
            
            Fournis l'analyse au format JSON avec:
            - sentiment: score de -1 (négatif) à 1 (positif)
            - urgency: "low", "normal", "high", "critical"
            - category: "support", "commercial", "info", "complaint", "request"
            - language: code langue détecté (fr, en, es, etc.)
            - entities: liste des entités importantes (noms, dates, références)
            - complexity: niveau 1-5 (1=simple, 5=très complexe)
            - keywords: mots-clés principaux
            - suggested_response_tone: "formal", "friendly", "apologetic", "informative"
            """
            
            response = self.openai_client.chat.completions.create(
                model=self.ai_config["model"],
                messages=[
                    {"role": "system", "content": "Tu es un expert en analyse d'emails professionnels. Réponds uniquement en JSON valide."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=self.ai_config["temperature"],
                max_tokens=self.ai_config["max_tokens"],
                timeout=self.ai_config["timeout"]
            )
            
            analysis_text = response.choices[0].message.content
            analysis_result = json.loads(analysis_text)
            
            analysis_result.update(self._local_analysis(content))
            analysis_result = self._validate_analysis_result(analysis_result)
            
            self.logger.info(f"Analyse IA terminée - Catégorie: {analysis_result.get('category')}")
            
            return analysis_result
            
        except json.JSONDecodeError as e:
            self.logger.warning(f"Erreur parsing JSON IA: {e}")
            return self._fallback_analysis(content)
        
        except Exception as e:
            self.logger.error(f"Erreur analyse IA: {e}")
            return self._fallback_analysis(content)
    
    def detect_missing_info(self, analysis_result: Dict, email_data: Dict) -> List[Dict]:
        """Détecte les informations manquantes pour traiter la demande"""
        missing_info = []
        category = analysis_result.get('category', 'info')
        
        detection_rules = {
            'support': ['order_id', 'problem_description', 'contact_info'],
            'commercial': ['budget', 'timeline', 'requirements'],
            'complaint': ['incident_date', 'order_reference', 'desired_resolution'],
            'request': ['specific_needs', 'deadline', 'contact_preference']
        }
        
        required_fields = detection_rules.get(category, ['contact_info'])
        
        for field in required_fields:
            if not self._check_info_present(field, email_data, analysis_result):
                missing_info.append({
                    'field': field,
                    'label': self._get_field_label(field),
                    'type': self._get_field_type(field),
                    'required': True,
                    'suggestion': self._get_field_suggestion(field, category)
                })
        
        return missing_info
    
    def generate_adaptive_form(self, missing_info: List[Dict], client_config: Dict) -> Dict:
        """Génère un formulaire adaptatif basé sur les informations manquantes"""
        form_schema = {
            "form_id": str(uuid.uuid4()),
            "title": "Informations complémentaires",
            "description": "Merci de compléter ces informations pour mieux vous aider",
            "fields": [],
            "accessibility": {
                "screen_reader_support": True,
                "keyboard_navigation": True,
                "high_contrast": client_config.get('accessibility', {}).get('high_contrast', False)
            },
            "validation_rules": {},
            "submit_action": "complete_workspace"
        }
        
        for info in missing_info:
            field = {
                "id": info['field'],
                "label": info['label'],
                "type": info['type'],
                "required": info['required'],
                "placeholder": info.get('suggestion', ''),
                "aria_label": f"Champ {info['label']} {'obligatoire' if info['required'] else 'optionnel'}",
                "validation": self._get_field_validation(info['field'])
            }
            
            if client_config.get('form_customization'):
                field.update(client_config['form_customization'].get(info['field'], {}))
            
            form_schema["fields"].append(field)
        
        return form_schema
    
    def simulate_human_questions(self, email_content: str, context: Dict) -> List[str]:
        """Simule les questions qu'un humain poserait"""
        try:
            prompt = f"""
            En tant qu'assistant humain professionnel, quelles questions poserais-tu pour mieux comprendre cette demande?
            
            Email: {email_content[:1000]}
            Contexte: {context.get('category', 'général')}
            
            Génère 3-5 questions naturelles et bienveillantes qu'un humain poserait.
            Format: liste JSON de strings.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Tu es un assistant professionnel bienveillant. Génère des questions naturelles en JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=500
            )
            
            questions = json.loads(response.choices[0].message.content)
            return questions if isinstance(questions, list) else []
            
        except Exception as e:
            self.logger.error(f"Erreur génération questions: {e}")
            return [
                "Pouvez-vous me donner plus de détails sur votre demande?",
                "Y a-t-il des informations spécifiques que je devrais connaître?",
                "Quel serait le meilleur moyen de vous aider?"
            ]
    
    def generate_ai_response(self, email_data: Dict, tone: str = "professional", language: str = "auto") -> Dict:
        """Génère une réponse IA personnalisée"""
        try:
            if language == "auto":
                language = email_data.get('analysis', {}).get('language', 'fr')
            
            context = email_data.get('analysis', {})
            original_content = email_data.get('content', '')
            
            response_prompt = f"""
            Génère une réponse professionnelle à cet email en {language}:
            
            Email original: {original_content[:1500]}
            Catégorie: {context.get('category', 'général')}
            Ton souhaité: {tone}
            Urgence: {context.get('urgency', 'normal')}
            
            La réponse doit être:
            - Professionnelle et bienveillante
            - Adaptée au contexte et à l'urgence
            - Personnalisée selon les informations disponibles
            - Proposer des solutions concrètes si possible
            - Inclure une signature appropriée
            
            Longueur: 100-300 mots selon la complexité.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": f"Tu es un assistant professionnel expert en communication {language}. Génère des réponses adaptées et bienveillantes."},
                    {"role": "user", "content": response_prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            generated_response = response.choices[0].message.content
            
            response_metadata = {
                "response_text": generated_response,
                "language": language,
                "tone": tone,
                "word_count": len(generated_response.split()),
                "generated_at": datetime.utcnow().isoformat(),
                "model_used": "gpt-4",
                "quality_score": self._assess_response_quality(generated_response)
            }
            
            return response_metadata
            
        except Exception as e:
            self.logger.error(f"Erreur génération réponse: {e}")
            return {
                "response_text": "Merci pour votre message. Nous avons bien reçu votre demande et reviendrons vers vous rapidement.",
                "language": language,
                "tone": tone,
                "generated_at": datetime.utcnow().isoformat(),
                "error": str(e)
            }
    
    # Méthodes utilitaires privées
    
    def _validate_email_data(self, email_data: Dict) -> bool:
        required_fields = ['content']
        return all(field in email_data for field in required_fields)
    
    def _encrypt_sensitive_data(self, data: Dict) -> str:
        json_data = json.dumps(data, ensure_ascii=False)
        encrypted = self.cipher.encrypt(json_data.encode())
        return encrypted.decode()
    
    def _local_analysis(self, content: str) -> Dict:
        local_analysis = {
            "word_count": len(content.split()),
            "char_count": len(content),
            "has_attachments": False,
            "detected_patterns": {}
        }
        
        for pattern_name, pattern in self.info_patterns.items():
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                local_analysis["detected_patterns"][pattern_name] = matches
        
        return local_analysis
    
    def _fallback_analysis(self, content: str) -> Dict:
        return {
            "sentiment": 0.0,
            "urgency": "normal",
            "category": "info",
            "language": "fr",
            "entities": [],
            "complexity": 2,
            "keywords": content.split()[:10],
            "suggested_response_tone": "professional",
            "fallback": True
        }
    
    def _validate_analysis_result(self, result: Dict) -> Dict:
        defaults = {
            "sentiment": 0.0,
            "urgency": "normal",
            "category": "info",
            "language": "fr",
            "entities": [],
            "complexity": 2,
            "keywords": [],
            "suggested_response_tone": "professional"
        }
        
        for key, default_value in defaults.items():
            if key not in result:
                result[key] = default_value
        
        return result
    
    def _check_info_present(self, field: str, email_data: Dict, analysis: Dict) -> bool:
        content = email_data.get('content', '').lower()
        
        field_indicators = {
            'order_id': ['commande', 'order', 'cmd', 'référence'],
            'contact_info': ['téléphone', 'phone', 'email', '@'],
            'problem_description': ['problème', 'issue', 'bug', 'erreur'],
            'budget': ['budget', 'prix', 'coût', '€', 'euro'],
            'timeline': ['délai', 'deadline', 'urgent', 'quand'],
            'incident_date': ['date', 'jour', 'hier', 'aujourd\'hui']
        }
        
        indicators = field_indicators.get(field, [])
        return any(indicator in content for indicator in indicators)
    
    def _get_field_label(self, field: str) -> str:
        labels = {
            'order_id': 'Numéro de commande',
            'contact_info': 'Informations de contact',
            'problem_description': 'Description du problème',
            'budget': 'Budget disponible',
            'timeline': 'Délai souhaité',
            'incident_date': 'Date de l\'incident',
            'specific_needs': 'Besoins spécifiques',
            'desired_resolution': 'Solution souhaitée'
        }
        return labels.get(field, field.replace('_', ' ').title())
    
    def _get_field_type(self, field: str) -> str:
        types = {
            'order_id': 'text',
            'contact_info': 'email',
            'problem_description': 'textarea',
            'budget': 'number',
            'timeline': 'date',
            'incident_date': 'date',
            'specific_needs': 'textarea',
            'desired_resolution': 'textarea'
        }
        return types.get(field, 'text')
    
    def _get_field_suggestion(self, field: str, category: str) -> str:
        suggestions = {
            'order_id': 'Ex: CMD-2024-001234',
            'contact_info': 'votre.email@exemple.com',
            'problem_description': 'Décrivez précisément le problème rencontré',
            'budget': 'Montant en euros',
            'timeline': 'Date limite souhaitée',
            'incident_date': 'Quand le problème est-il survenu?'
        }
        return suggestions.get(field, f'Veuillez préciser {self._get_field_label(field).lower()}')
    
    def _get_field_validation(self, field: str) -> Dict:
        validations = {
            'order_id': {'pattern': r'^[A-Z0-9-]{5,20}$', 'message': 'Format invalide'},
            'contact_info': {'type': 'email', 'message': 'Email invalide'},
            'budget': {'min': 0, 'max': 1000000, 'message': 'Budget invalide'},
            'problem_description': {'minLength': 10, 'message': 'Description trop courte'}
        }
        return validations.get(field, {})
    
    def _assess_response_quality(self, response_text: str) -> float:
        word_count = len(response_text.split())
        has_greeting = any(word in response_text.lower() for word in ['bonjour', 'hello', 'salut'])
        has_closing = any(word in response_text.lower() for word in ['cordialement', 'regards', 'merci'])
        
        quality_score = 0.5
        
        if 50 <= word_count <= 300:
            quality_score += 0.2
        if has_greeting:
            quality_score += 0.15
        if has_closing:
            quality_score += 0.15
        
        return min(1.0, quality_score)