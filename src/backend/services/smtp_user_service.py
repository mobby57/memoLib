"""
Service SMTP Multi-Utilisateurs - iaPosteManager
Gestion des configurations SMTP par utilisateur
"""
import smtplib
import sqlite3
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
from cryptography.fernet import Fernet
import os
from models.smtp_config import SMTPConfig, SMTP_PROVIDERS

class SMTPUserService:
    def __init__(self):
        self.db_path = 'data/smtp_configs.db'
        self.encryption_key = self._get_encryption_key()
        self.cipher = Fernet(self.encryption_key)
        self._init_database()
    
    def _get_encryption_key(self) -> bytes:
        """Récupère ou génère la clé de chiffrement"""
        key_file = 'data/smtp_encryption.key'
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            os.makedirs('data', exist_ok=True)
            with open(key_file, 'wb') as f:
                f.write(key)
            return key
    
    def _init_database(self):
        """Initialise la base de données SMTP"""
        os.makedirs('data', exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS smtp_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    smtp_server TEXT NOT NULL,
                    smtp_port INTEGER NOT NULL,
                    username TEXT NOT NULL,
                    password_encrypted TEXT NOT NULL,
                    use_tls BOOLEAN DEFAULT TRUE,
                    use_ssl BOOLEAN DEFAULT FALSE,
                    display_name TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, username)
                )
            ''')
    
    def add_smtp_config(self, user_id: str, config_data: Dict[str, Any]) -> bool:
        """Ajoute une configuration SMTP pour un utilisateur"""
        try:
            # Chiffrement du mot de passe
            password_encrypted = self.cipher.encrypt(
                config_data['password'].encode()
            ).decode()
            
            config = SMTPConfig(
                user_id=user_id,
                provider=config_data['provider'],
                smtp_server=config_data.get('smtp_server', 
                    SMTP_PROVIDERS[config_data['provider']]['smtp_server']),
                smtp_port=config_data.get('smtp_port',
                    SMTP_PROVIDERS[config_data['provider']]['smtp_port']),
                username=config_data['username'],
                password_encrypted=password_encrypted,
                use_tls=config_data.get('use_tls', True),
                use_ssl=config_data.get('use_ssl', False),
                display_name=config_data.get('display_name')
            )
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT OR REPLACE INTO smtp_configs 
                    (user_id, provider, smtp_server, smtp_port, username, 
                     password_encrypted, use_tls, use_ssl, display_name, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    config.user_id, config.provider, config.smtp_server,
                    config.smtp_port, config.username, config.password_encrypted,
                    config.use_tls, config.use_ssl, config.display_name, config.is_active
                ))
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur ajout config SMTP: {e}")
            return False
    
    def get_user_smtp_configs(self, user_id: str) -> List[Dict[str, Any]]:
        """Récupère les configurations SMTP d'un utilisateur"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute('''
                    SELECT * FROM smtp_configs 
                    WHERE user_id = ? AND is_active = TRUE
                    ORDER BY created_at DESC
                ''', (user_id,))
                
                configs = []
                for row in cursor.fetchall():
                    config = dict(row)
                    # Ne pas exposer le mot de passe chiffré
                    config.pop('password_encrypted', None)
                    configs.append(config)
                
                return configs
                
        except Exception as e:
            print(f"❌ Erreur récupération configs: {e}")
            return []
    
    def test_smtp_connection(self, user_id: str, username: str) -> Dict[str, Any]:
        """Test la connexion SMTP"""
        try:
            config = self._get_smtp_config(user_id, username)
            if not config:
                return {'success': False, 'error': 'Configuration non trouvée'}
            
            # Déchiffrement du mot de passe
            password = self.cipher.decrypt(
                config['password_encrypted'].encode()
            ).decode()
            
            # Test de connexion
            with smtplib.SMTP(config['smtp_server'], config['smtp_port']) as server:
                if config['use_tls']:
                    server.starttls()
                server.login(config['username'], password)
            
            return {'success': True, 'message': 'Connexion SMTP réussie'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def send_email_for_user(
        self, 
        user_id: str, 
        username: str,
        to: List[str],
        subject: str,
        body_html: str,
        body_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """Envoie un email pour un utilisateur spécifique"""
        try:
            config = self._get_smtp_config(user_id, username)
            if not config:
                return {'success': False, 'error': 'Configuration SMTP non trouvée'}
            
            # Déchiffrement du mot de passe
            password = self.cipher.decrypt(
                config['password_encrypted'].encode()
            ).decode()
            
            # Création du message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{config.get('display_name', config['username'])} <{config['username']}>"
            msg['To'] = ', '.join(to)
            msg['Subject'] = subject
            
            if body_text:
                msg.attach(MIMEText(body_text, 'plain'))
            msg.attach(MIMEText(body_html, 'html'))
            
            # Envoi
            with smtplib.SMTP(config['smtp_server'], config['smtp_port']) as server:
                if config['use_tls']:
                    server.starttls()
                server.login(config['username'], password)
                server.send_message(msg, config['username'], to)
            
            return {'success': True, 'message': 'Email envoyé avec succès'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_smtp_config(self, user_id: str, username: str) -> Optional[Dict[str, Any]]:
        """Récupère une configuration SMTP spécifique"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute('''
                    SELECT * FROM smtp_configs 
                    WHERE user_id = ? AND username = ? AND is_active = TRUE
                ''', (user_id, username))
                
                row = cursor.fetchone()
                return dict(row) if row else None
                
        except Exception as e:
            print(f"❌ Erreur récupération config: {e}")
            return None
    
    def delete_smtp_config(self, user_id: str, username: str) -> bool:
        """Supprime une configuration SMTP"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    UPDATE smtp_configs 
                    SET is_active = FALSE 
                    WHERE user_id = ? AND username = ?
                ''', (user_id, username))
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur suppression config: {e}")
            return False

# Instance globale
smtp_service = SMTPUserService()