"""
Modèle SMTP Configuration - Multi-utilisateurs
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any
import json
from cryptography.fernet import Fernet
import os

@dataclass
class SMTPConfig:
    user_id: str
    provider: str  # gmail, outlook, custom
    smtp_server: str
    smtp_port: int
    username: str
    password_encrypted: str  # Chiffré
    use_tls: bool = True
    use_ssl: bool = False
    display_name: Optional[str] = None
    is_active: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'user_id': self.user_id,
            'provider': self.provider,
            'smtp_server': self.smtp_server,
            'smtp_port': self.smtp_port,
            'username': self.username,
            'password_encrypted': self.password_encrypted,
            'use_tls': self.use_tls,
            'use_ssl': self.use_ssl,
            'display_name': self.display_name,
            'is_active': self.is_active
        }

# Providers prédéfinis
SMTP_PROVIDERS = {
    'gmail': {
        'name': 'Gmail',
        'smtp_server': 'smtp.gmail.com',
        'smtp_port': 587,
        'use_tls': True,
        'auth_url': 'https://myaccount.google.com/apppasswords'
    },
    'outlook': {
        'name': 'Outlook/Hotmail',
        'smtp_server': 'smtp-mail.outlook.com',
        'smtp_port': 587,
        'use_tls': True
    },
    'yahoo': {
        'name': 'Yahoo Mail',
        'smtp_server': 'smtp.mail.yahoo.com',
        'smtp_port': 587,
        'use_tls': True
    },
    'custom': {
        'name': 'SMTP Personnalisé',
        'smtp_server': '',
        'smtp_port': 587,
        'use_tls': True
    }
}