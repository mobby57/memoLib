"""Service SMTP pour envoi d'emails"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

class SMTPService:
    def __init__(self):
        self.smtp_configs = {
            'gmail': {'host': 'smtp.gmail.com', 'port': 587},
            'outlook': {'host': 'smtp-mail.outlook.com', 'port': 587},
            'yahoo': {'host': 'smtp.mail.yahoo.com', 'port': 587}
        }
    
    def detect_provider(self, email):
        """Détecter le fournisseur d'email"""
        domain = email.split('@')[1].lower()
        if 'gmail' in domain:
            return 'gmail'
        elif 'outlook' in domain or 'hotmail' in domain:
            return 'outlook'
        elif 'yahoo' in domain:
            return 'yahoo'
        return 'gmail'  # Par défaut
    
    def send_email(self, sender_email, app_password, recipient, subject, body, sender_name=None):
        """Envoyer un email via SMTP"""
        try:
            provider = self.detect_provider(sender_email)
            config = self.smtp_configs[provider]
            
            # Créer le message
            msg = MIMEMultipart()
            
            # Formater le champ From avec le nom si fourni
            if sender_name:
                msg['From'] = f"{sender_name} <{sender_email}>"
            else:
                msg['From'] = sender_email
                
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Envoyer via SMTP
            with smtplib.SMTP(config['host'], config['port']) as server:
                server.starttls()
                server.login(sender_email, app_password)
                server.send_message(msg)
            
            logger.info(f"Email envoyé: {sender_email} -> {recipient}")
            return {'success': True, 'message': 'Email envoyé avec succès'}
            
        except smtplib.SMTPAuthenticationError:
            error = 'Erreur d\'authentification - Vérifiez votre App Password'
            logger.error(f"SMTP Auth Error: {sender_email}")
            return {'success': False, 'error': error}
            
        except smtplib.SMTPRecipientsRefused:
            error = 'Destinataire refusé - Email invalide'
            logger.error(f"Recipient refused: {recipient}")
            return {'success': False, 'error': error}
            
        except Exception as e:
            error = f'Erreur envoi: {str(e)}'
            logger.error(f"SMTP Error: {e}")
            return {'success': False, 'error': error}