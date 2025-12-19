"""Service d'envoi d'emails avec gestion avancée"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.core.database import db, Email
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, smtp_host='smtp.gmail.com', smtp_port=587):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
    
    def send(self, from_email, to_email, subject, body, password):
        """Envoyer un email via SMTP"""
        try:
            msg = MIMEMultipart()
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(from_email, password)
                server.send_message(msg)
            
            email = Email(to_email=to_email, subject=subject, body=body, status='sent')
            db.session.add(email)
            db.session.commit()
            
            logger.info(f"Email envoyé à {to_email}")
            return True, email.id
            
        except Exception as e:
            logger.error(f"Erreur envoi email: {e}")
            return False, str(e)
    
    def get_history(self, limit=50):
        """Récupérer l'historique des emails"""
        emails = Email.query.order_by(Email.sent_at.desc()).limit(limit).all()
        return [email.to_dict() for email in emails]
