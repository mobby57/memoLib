"""
Service Email Production - iaPosteManager
Configuration SMTP avancée avec templates et tracking
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import List, Optional
import os
from jinja2 import Template

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('MAIL_PORT', 587))
        self.username = os.getenv('MAIL_USERNAME')
        self.password = os.getenv('MAIL_PASSWORD')
        self.sender = os.getenv('MAIL_DEFAULT_SENDER', self.username)
        self.use_tls = os.getenv('MAIL_USE_TLS', 'True') == 'True'
        
    def send_email(
        self,
        to: List[str],
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[dict]] = None
    ) -> bool:
        """Envoie un email avec support HTML et pièces jointes"""
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.sender
            msg['To'] = ', '.join(to)
            msg['Subject'] = subject
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            
            # Corps texte (fallback)
            if body_text:
                msg.attach(MIMEText(body_text, 'plain'))
            
            # Corps HTML
            msg.attach(MIMEText(body_html, 'html'))
            
            # Pièces jointes
            if attachments:
                for att in attachments:
                    part = MIMEImage(att['data'])
                    part.add_header('Content-Disposition', f'attachment; filename={att["filename"]}')
                    msg.attach(part)
            
            # Envoi
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                
                all_recipients = to + (cc or []) + (bcc or [])
                server.send_message(msg, self.sender, all_recipients)
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur envoi email: {e}")
            return False
    
    def send_template_email(
        self,
        to: List[str],
        template_name: str,
        context: dict,
        subject: str
    ) -> bool:
        """Envoie un email à partir d'un template"""
        template_path = f'templates/email/{template_name}.html'
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template = Template(f.read())
            
            html = template.render(**context)
            return self.send_email(to, subject, html)
            
        except Exception as e:
            print(f"❌ Erreur template email: {e}")
            return False

# Templates prédéfinis
EMAIL_TEMPLATES = {
    'welcome': {
        'subject': 'Bienvenue sur iaPosteManager',
        'template': 'welcome.html'
    },
    'password_reset': {
        'subject': 'Réinitialisation de votre mot de passe',
        'template': 'password_reset.html'
    },
    'email_sent': {
        'subject': 'Votre email a été envoyé',
        'template': 'email_sent.html'
    },
    'newsletter': {
        'subject': 'Newsletter iaPosteManager',
        'template': 'newsletter.html'
    }
}
