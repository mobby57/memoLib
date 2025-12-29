"""
Module MultiClientManager - Configuration avancée multi-client
Propriété: MS CONSEILS - Sarra Boudjellal
Version: 2.3 Production Ready
"""

import json
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from cryptography.fernet import Fernet
import logging
import hashlib
from datetime import datetime

@dataclass
class ClientConfig:
    client_id: str
    name: str
    email_settings: Dict
    ai_settings: Dict
    form_settings: Dict
    security_settings: Dict
    accessibility_settings: Dict
    notification_settings: Dict
    branding: Dict
    created_at: str = None
    updated_at: str = None

class MultiClientManager:
    """Gestionnaire de configuration multi-client avec chiffrement"""
    
    def __init__(self, config_path: str, encryption_key: str):
        self.config_path = Path(config_path)
        self.cipher = Fernet(encryption_key.encode())
        self.clients = {}
        self.logger = self._setup_logger()
        self.config_path.mkdir(parents=True, exist_ok=True)
        self.load_all_configs()
    
    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger("multi_client_manager")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def load_all_configs(self):
        """Charge toutes les configurations client"""
        try:
            for config_file in self.config_path.glob("*.json"):
                client_id = config_file.stem
                config = self.load_client_config(client_id)
                if config:
                    self.clients[client_id] = config
            
            self.logger.info(f"Configurations chargées pour {len(self.clients)} clients")
            
        except Exception as e:
            self.logger.error(f"Erreur chargement configurations: {e}")
    
    def load_client_config(self, client_id: str) -> Optional[ClientConfig]:
        """Charge la configuration d'un client spécifique"""
        try:
            config_file = self.config_path / f"{client_id}.json"
            
            if not config_file.exists():
                return None
            
            with open(config_file, 'r', encoding='utf-8') as f:
                encrypted_data = f.read()
            
            # Déchiffrement
            decrypted_data = self.cipher.decrypt(encrypted_data.encode()).decode()
            config_dict = json.loads(decrypted_data)
            
            return ClientConfig(**config_dict)
            
        except Exception as e:
            self.logger.error(f"Erreur chargement config client {client_id}: {e}")
            return None
    
    def save_client_config(self, config: ClientConfig) -> bool:
        """Sauvegarde la configuration client avec chiffrement"""
        try:
            config.updated_at = datetime.utcnow().isoformat()
            if not config.created_at:
                config.created_at = config.updated_at
            
            # Sérialisation et chiffrement
            config_dict = asdict(config)
            json_data = json.dumps(config_dict, ensure_ascii=False, indent=2)
            encrypted_data = self.cipher.encrypt(json_data.encode())
            
            # Sauvegarde
            config_file = self.config_path / f"{config.client_id}.json"
            with open(config_file, 'w', encoding='utf-8') as f:
                f.write(encrypted_data.decode())
            
            # Mise à jour du cache
            self.clients[config.client_id] = config
            
            self.logger.info(f"Configuration sauvegardée pour client {config.client_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur sauvegarde config client {config.client_id}: {e}")
            return False
    
    def get_client_config(self, client_id: str) -> Optional[ClientConfig]:
        """Récupère la configuration d'un client"""
        return self.clients.get(client_id)
    
    def create_default_config(self, client_id: str, client_name: str) -> ClientConfig:
        """Crée une configuration par défaut pour un nouveau client"""
        return ClientConfig(
            client_id=client_id,
            name=client_name,
            email_settings={
                "providers": ["smtp"],
                "default_sender": f"noreply@{client_id}.com",
                "signature": f"Cordialement,\nÉquipe {client_name}",
                "auto_reply": True,
                "tracking": True,
                "templates": {
                    "welcome": "Bienvenue chez {client_name}",
                    "support": "Nous avons bien reçu votre demande de support",
                    "commercial": "Merci pour votre intérêt pour nos services"
                }
            },
            ai_settings={
                "model": "gpt-4",
                "temperature": 0.7,
                "max_tokens": 1000,
                "tone": "professional",
                "language": "fr",
                "custom_prompts": {
                    "email_analysis": "Analyser cet email professionnel pour {client_name}",
                    "response_generation": "Générer une réponse courtoise au nom de {client_name}"
                },
                "fallback_enabled": True,
                "cache_responses": True
            },
            form_settings={
                "theme": "default",
                "required_fields": ["name", "email", "subject"],
                "optional_fields": ["phone", "company", "message"],
                "validation_rules": {
                    "email": "strict",
                    "phone": "international"
                },
                "custom_fields": [],
                "multi_step": False,
                "save_progress": True
            },
            security_settings={
                "encryption_level": "aes_256",
                "data_retention_days": 365,
                "audit_logging": True,
                "ip_whitelist": [],
                "two_factor_auth": False,
                "session_timeout": 3600,
                "password_policy": {
                    "min_length": 8,
                    "require_uppercase": True,
                    "require_numbers": True,
                    "require_symbols": False
                }
            },
            accessibility_settings={
                "screen_reader_support": True,
                "high_contrast_mode": False,
                "keyboard_navigation": True,
                "voice_commands": False,
                "text_to_speech": False,
                "font_size_options": [12, 14, 16, 18, 20],
                "language_options": ["fr", "en"]
            },
            notification_settings={
                "email_notifications": True,
                "sms_notifications": False,
                "push_notifications": True,
                "notification_frequency": "immediate",
                "quiet_hours": {
                    "enabled": False,
                    "start": "22:00",
                    "end": "08:00"
                },
                "channels": {
                    "email": True,
                    "slack": False,
                    "teams": False,
                    "webhook": False
                }
            },
            branding={
                "logo_url": f"/assets/logos/{client_id}.png",
                "primary_color": "#1e40af",
                "secondary_color": "#3b82f6",
                "font_family": "Inter, sans-serif",
                "custom_css": f"/assets/themes/{client_id}.css",
                "favicon": f"/assets/favicons/{client_id}.ico",
                "company_info": {
                    "address": "",
                    "phone": "",
                    "website": "",
                    "social_media": {}
                }
            }
        )
    
    def get_email_template(self, client_id: str, template_type: str) -> str:
        """Récupère un template email personnalisé"""
        config = self.get_client_config(client_id)
        if not config:
            return self._get_default_template(template_type)
        
        templates = config.email_settings.get('templates', {})
        return templates.get(template_type, self._get_default_template(template_type))
    
    def validate_client_permissions(self, client_id: str, action: str) -> bool:
        """Valide les permissions d'action pour un client"""
        config = self.get_client_config(client_id)
        if not config:
            return False
        
        # Logique de validation des permissions
        permissions = config.security_settings.get('permissions', {})
        return permissions.get(action, True)  # Par défaut autorisé
    
    def get_ai_config(self, client_id: str) -> Dict:
        """Récupère la configuration IA pour un client"""
        config = self.get_client_config(client_id)
        if not config:
            return self._get_default_ai_config()
        
        return config.ai_settings
    
    def get_form_config(self, client_id: str) -> Dict:
        """Récupère la configuration de formulaire pour un client"""
        config = self.get_client_config(client_id)
        if not config:
            return self._get_default_form_config()
        
        return config.form_settings
    
    def update_client_setting(self, client_id: str, setting_path: str, value: Any) -> bool:
        """Met à jour un paramètre spécifique d'un client"""
        try:
            config = self.get_client_config(client_id)
            if not config:
                return False
            
            # Navigation dans la structure de configuration
            keys = setting_path.split('.')
            config_dict = asdict(config)
            
            # Navigation jusqu'au parent
            current = config_dict
            for key in keys[:-1]:
                if key not in current:
                    current[key] = {}
                current = current[key]
            
            # Mise à jour de la valeur
            current[keys[-1]] = value
            
            # Reconstruction de la configuration
            updated_config = ClientConfig(**config_dict)
            
            return self.save_client_config(updated_config)
            
        except Exception as e:
            self.logger.error(f"Erreur mise à jour paramètre {setting_path} pour {client_id}: {e}")
            return False
    
    def export_client_config(self, client_id: str, format: str = 'json') -> Optional[str]:
        """Exporte la configuration d'un client"""
        try:
            config = self.get_client_config(client_id)
            if not config:
                return None
            
            config_dict = asdict(config)
            
            if format.lower() == 'json':
                return json.dumps(config_dict, ensure_ascii=False, indent=2)
            elif format.lower() == 'yaml':
                return yaml.dump(config_dict, default_flow_style=False, allow_unicode=True)
            else:
                return None
                
        except Exception as e:
            self.logger.error(f"Erreur export config {client_id}: {e}")
            return None
    
    def import_client_config(self, client_id: str, config_data: str, format: str = 'json') -> bool:
        """Importe une configuration client"""
        try:
            if format.lower() == 'json':
                config_dict = json.loads(config_data)
            elif format.lower() == 'yaml':
                config_dict = yaml.safe_load(config_data)
            else:
                return False
            
            config_dict['client_id'] = client_id  # Force l'ID client
            config = ClientConfig(**config_dict)
            
            return self.save_client_config(config)
            
        except Exception as e:
            self.logger.error(f"Erreur import config {client_id}: {e}")
            return False
    
    def list_clients(self) -> List[Dict]:
        """Liste tous les clients avec informations de base"""
        clients_info = []
        
        for client_id, config in self.clients.items():
            clients_info.append({
                'client_id': client_id,
                'name': config.name,
                'created_at': config.created_at,
                'updated_at': config.updated_at,
                'active': True  # À implémenter selon votre logique
            })
        
        return clients_info
    
    def clone_client_config(self, source_client_id: str, target_client_id: str, target_name: str) -> bool:
        """Clone la configuration d'un client vers un autre"""
        try:
            source_config = self.get_client_config(source_client_id)
            if not source_config:
                return False
            
            # Création d'une copie
            config_dict = asdict(source_config)
            config_dict['client_id'] = target_client_id
            config_dict['name'] = target_name
            config_dict['created_at'] = None  # Sera défini lors de la sauvegarde
            config_dict['updated_at'] = None
            
            target_config = ClientConfig(**config_dict)
            
            return self.save_client_config(target_config)
            
        except Exception as e:
            self.logger.error(f"Erreur clonage config {source_client_id} -> {target_client_id}: {e}")
            return False
    
    def validate_config(self, config: ClientConfig) -> Dict[str, List[str]]:
        """Valide une configuration client"""
        errors = {}
        
        # Validation des champs obligatoires
        if not config.client_id:
            errors.setdefault('client_id', []).append('ID client requis')
        
        if not config.name:
            errors.setdefault('name', []).append('Nom client requis')
        
        # Validation des paramètres email
        email_settings = config.email_settings
        if not email_settings.get('default_sender'):
            errors.setdefault('email_settings', []).append('Expéditeur par défaut requis')
        
        # Validation des paramètres IA
        ai_settings = config.ai_settings
        if ai_settings.get('temperature', 0) < 0 or ai_settings.get('temperature', 0) > 2:
            errors.setdefault('ai_settings', []).append('Température doit être entre 0 et 2')
        
        # Validation des couleurs de branding
        branding = config.branding
        for color_key in ['primary_color', 'secondary_color']:
            color = branding.get(color_key, '')
            if color and not color.startswith('#'):
                errors.setdefault('branding', []).append(f'{color_key} doit commencer par #')
        
        return errors
    
    # Méthodes utilitaires privées
    
    def _get_default_template(self, template_type: str) -> str:
        """Templates par défaut"""
        templates = {
            'welcome': 'Bienvenue ! Nous sommes ravis de vous accueillir.',
            'support': 'Nous avons bien reçu votre demande de support et reviendrons vers vous rapidement.',
            'commercial': 'Merci pour votre intérêt. Nous étudions votre demande.',
            'generic': 'Merci pour votre message. Nous reviendrons vers vous prochainement.'
        }
        return templates.get(template_type, templates['generic'])
    
    def _get_default_ai_config(self) -> Dict:
        """Configuration IA par défaut"""
        return {
            "model": "gpt-4",
            "temperature": 0.7,
            "max_tokens": 1000,
            "tone": "professional",
            "language": "fr"
        }
    
    def _get_default_form_config(self) -> Dict:
        """Configuration formulaire par défaut"""
        return {
            "theme": "default",
            "required_fields": ["name", "email", "subject"],
            "optional_fields": ["message"],
            "validation_rules": {"email": "strict"}
        }