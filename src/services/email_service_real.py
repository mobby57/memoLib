"""Service email fonctionnel"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_servers = {
            'gmail': ('smtp.gmail.com', 587),
            'outlook': ('smtp-mail.outlook.com', 587)
        }
    
    def send_email(self, credentials, recipient, subject, body, provider='gmail', sender_name=None):
        try:
            server_host, port = self.smtp_servers[provider]
            email, app_password = credentials
            
            msg = MIMEMultipart()
            
            # Formater le champ From avec le nom si fourni
            if sender_name:
                msg['From'] = f"{sender_name} <{email}>"
            else:
                msg['From'] = email
                
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(server_host, port) as server:
                server.starttls()
                server.login(email, app_password)
                server.send_message(msg)
            
            logger.info(f"Email envoyé à {recipient}")
            return True, "Email envoyé avec succès"
            
        except Exception as e:
            logger.error(f"Erreur envoi email: {e}")
            return False, str(e)