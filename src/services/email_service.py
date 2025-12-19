"""Service d'envoi d'emails avec gestion avancée"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.core.database import Database
import logging
import os
from src.core.config import Config

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, smtp_host='smtp.gmail.com', smtp_port=587):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.db = Database(os.path.join(Config.APP_DIR, 'app.db'))
    
    def send_email(self, credentials, to_email, subject, body):
        """Envoyer un email via SMTP"""
        try:
            from_email, password = credentials
            
            msg = MIMEMultipart()
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(from_email, password)
                server.send_message(msg)
            
            # Enregistrer dans la base de données
            self.db.log_email(to_email, subject, body, 'sent')
            
            logger.info(f"Email envoyé à {to_email}")
            return {'success': True, 'message': 'Email envoyé avec succès'}
            
        except Exception as e:
            logger.error(f"Erreur envoi email: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_history(self, limit=50):
        """Récupérer l'historique des emails"""
        return self.db.get_email_history(limit)
