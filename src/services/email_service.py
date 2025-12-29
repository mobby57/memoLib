import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
import json
from datetime import datetime
from typing import List, Optional, Dict
import requests
import boto3
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class EmailService:
    def __init__(self):
        self.providers = {
            'smtp': self._send_smtp,
            'sendgrid': self._send_sendgrid,
            'aws_ses': self._send_aws_ses,
            'gmail': self._send_gmail
        }
        
    async def send_email(self, to: str, subject: str, content: str, 
                        provider: str = 'smtp', attachments: List = None) -> Dict:
        """Envoyer un email via le provider spécifié"""
        try:
            if provider not in self.providers:
                raise ValueError(f"Provider {provider} non supporté")
                
            result = await self.providers[provider](to, subject, content, attachments)
            
            # Sauvegarder dans l'historique
            await self._save_to_history({
                'to': to,
                'subject': subject,
                'content': content,
                'provider': provider,
                'status': 'sent',
                'sent_at': datetime.now().isoformat(),
                'message_id': result.get('message_id')
            })
            
            return result
            
        except Exception as e:
            await self._save_to_history({
                'to': to,
                'subject': subject,
                'status': 'failed',
                'error': str(e),
                'sent_at': datetime.now().isoformat()
            })
            raise
    
    async def _send_smtp(self, to: str, subject: str, content: str, attachments: List = None):
        """Envoi via SMTP"""
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        if not smtp_user or not smtp_password:
            raise ValueError("SMTP credentials manquantes")
        
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to
        msg['Subject'] = subject
        
        msg.attach(MIMEText(content, 'html'))
        
        # Attachments
        if attachments:
            for file_path in attachments:
                with open(file_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {os.path.basename(file_path)}'
                    )
                    msg.attach(part)
        
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to, msg.as_string())
            
        return {'message_id': f'smtp_{datetime.now().timestamp()}', 'status': 'sent'}
    
    async def _send_sendgrid(self, to: str, subject: str, content: str, attachments: List = None):
        """Envoi via SendGrid"""
        api_key = os.getenv('SENDGRID_API_KEY')
        from_email = os.getenv('SENDGRID_FROM_EMAIL')
        
        if not api_key:
            raise ValueError("SendGrid API key manquante")
            
        message = Mail(
            from_email=from_email,
            to_emails=to,
            subject=subject,
            html_content=content
        )
        
        sg = SendGridAPIClient(api_key=api_key)
        response = sg.send(message)
        
        return {'message_id': response.headers.get('X-Message-Id'), 'status': 'sent'}
    
    async def _send_aws_ses(self, to: str, subject: str, content: str, attachments: List = None):
        """Envoi via AWS SES"""
        client = boto3.client(
            'ses',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'eu-west-1')
        )
        
        response = client.send_email(
            Source=os.getenv('AWS_SES_FROM_EMAIL'),
            Destination={'ToAddresses': [to]},
            Message={
                'Subject': {'Data': subject},
                'Body': {'Html': {'Data': content}}
            }
        )
        
        return {'message_id': response['MessageId'], 'status': 'sent'}
    
    async def _send_gmail(self, to: str, subject: str, content: str, attachments: List = None):
        """Envoi via Gmail API"""
        # Utilise SMTP pour Gmail avec app password
        return await self._send_smtp(to, subject, content, attachments)
    
    async def _save_to_history(self, email_data: Dict):
        """Sauvegarder l'email dans l'historique"""
        history_file = 'data/email_history.json'
        
        # Créer le dossier si nécessaire
        os.makedirs(os.path.dirname(history_file), exist_ok=True)
        
        # Charger l'historique existant
        history = []
        if os.path.exists(history_file):
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            except:
                history = []
        
        # Ajouter le nouvel email
        history.append(email_data)
        
        # Garder seulement les 1000 derniers emails
        history = history[-1000:]
        
        # Sauvegarder
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    
    async def get_history(self, limit: int = 50) -> List[Dict]:
        """Récupérer l'historique des emails"""
        history_file = 'data/email_history.json'
        
        if not os.path.exists(history_file):
            return []
            
        try:
            with open(history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            return history[-limit:]
        except:
            return []