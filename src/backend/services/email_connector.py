"""
Email Service - Connecteur IMAP/SMTP pour IA Poste Manager
Permet de recevoir et envoyer des emails automatiquement.
"""

import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from typing import List, Dict, Optional
from dataclasses import dataclass, field
import os
import logging
from datetime import datetime
import re

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    """Représente un email parsé"""
    message_id: str
    from_address: str
    to_address: str
    subject: str
    body: str
    html_body: Optional[str] = None
    date: str = ""
    attachments: List[str] = field(default_factory=list)
    in_reply_to: Optional[str] = None
    references: Optional[str] = None
    
    def __str__(self):
        return f"Email from {self.from_address}: {self.subject}"


class EmailConnector:
    """
    Connecteur Email IMAP/SMTP
    Gère la réception (IMAP) et l'envoi (SMTP) d'emails
    """
    
    def __init__(self):
        """Initialise le connecteur avec les variables d'environnement"""
        # Configuration IMAP
        self.imap_host = os.getenv('IMAP_HOST', 'imap.gmail.com')
        self.imap_port = int(os.getenv('IMAP_PORT', 993))
        self.imap_user = os.getenv('IMAP_USERNAME', '')
        self.imap_password = os.getenv('IMAP_PASSWORD', '')
        self.imap_use_ssl = os.getenv('IMAP_USE_SSL', 'true').lower() == 'true'
        self.imap_folder = os.getenv('IMAP_FOLDER', 'INBOX')
        
        # Configuration SMTP
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_user = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.smtp_use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        self.smtp_from_name = os.getenv('SMTP_FROM_NAME', 'IA Poste Manager')
        
        # Validation configuration
        if not self.imap_user or not self.imap_password:
            logger.warning("⚠️ IMAP credentials not configured in .env")
        if not self.smtp_user or not self.smtp_password:
            logger.warning("⚠️ SMTP credentials not configured in .env")
    
    def connect_imap(self) -> imaplib.IMAP4_SSL:
        """Établit une connexion IMAP sécurisée"""
        try:
            logger.info(f"📧 Connexion IMAP à {self.imap_host}:{self.imap_port}...")
            
            if self.imap_use_ssl:
                mail = imaplib.IMAP4_SSL(self.imap_host, self.imap_port)
            else:
                mail = imaplib.IMAP4(self.imap_host, self.imap_port)
            
            mail.login(self.imap_user, self.imap_password)
            logger.info("✅ Connexion IMAP réussie")
            return mail
            
        except Exception as e:
            logger.error(f"❌ Erreur connexion IMAP: {e}")
            raise
    
    def fetch_new_emails(self, folder: str = None, mark_as_read: bool = False) -> List[EmailMessage]:
        """Récupère les nouveaux emails non lus"""
        if folder is None:
            folder = self.imap_folder
        
        emails = []
        mail = None
        
        try:
            mail = self.connect_imap()
            mail.select(folder)
            
            logger.info(f"🔍 Recherche emails non lus dans {folder}...")
            status, messages = mail.search(None, 'UNSEEN')
            
            if status != 'OK':
                logger.warning(f"⚠️ Erreur recherche emails: {status}")
                return emails
            
            email_ids = messages[0].split()
            logger.info(f"📬 {len(email_ids)} nouveaux emails trouvés")
            
            for email_id in email_ids:
                try:
                    status, msg_data = mail.fetch(email_id, '(RFC822)')
                    if status != 'OK':
                        continue
                    
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    parsed_email = self._parse_email(msg)
                    emails.append(parsed_email)
                    
                    if mark_as_read:
                        mail.store(email_id, '+FLAGS', '\\Seen')
                        
                except Exception as e:
                    logger.error(f"❌ Erreur parsing email {email_id}: {e}")
                    continue
            
            logger.info(f"✅ {len(emails)} emails parsés avec succès")
            
        except Exception as e:
            logger.error(f"❌ Erreur fetch emails: {e}")
            
        finally:
            if mail:
                try:
                    mail.close()
                    mail.logout()
                except:
                    pass
        
        return emails
    
    def _parse_email(self, msg) -> EmailMessage:
        """Parse un email brut en objet EmailMessage"""
        message_id = msg.get('Message-ID', '')
        from_address = self._decode_header_value(msg.get('From', ''))
        to_address = self._decode_header_value(msg.get('To', ''))
        subject = self._decode_header_value(msg.get('Subject', '(Sans objet)'))
        date = msg.get('Date', '')
        in_reply_to = msg.get('In-Reply-To', None)
        references = msg.get('References', None)
        
        body = ''
        html_body = None
        attachments = []
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                if content_type == 'text/plain' and 'attachment' not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        body = str(part.get_payload())
                
                elif content_type == 'text/html' and 'attachment' not in content_disposition:
                    try:
                        html_body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        html_body = str(part.get_payload())
                
                elif 'attachment' in content_disposition:
                    filename = part.get_filename()
                    if filename:
                        attachments.append(self._decode_header_value(filename))
        else:
            try:
                body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
            except:
                body = str(msg.get_payload())
        
        if not body and html_body:
            body = self._html_to_text(html_body)
        
        return EmailMessage(
            message_id=message_id,
            from_address=from_address,
            to_address=to_address,
            subject=subject,
            body=body.strip(),
            html_body=html_body,
            date=date,
            attachments=attachments,
            in_reply_to=in_reply_to,
            references=references
        )
    
    def _decode_header_value(self, value: str) -> str:
        """Décode un header email (gère l'encodage)"""
        if not value:
            return ''
        
        decoded_parts = []
        for part, encoding in decode_header(value):
            if isinstance(part, bytes):
                try:
                    decoded_parts.append(part.decode(encoding or 'utf-8', errors='ignore'))
                except:
                    decoded_parts.append(part.decode('utf-8', errors='ignore'))
            else:
                decoded_parts.append(str(part))
        
        return ''.join(decoded_parts)
    
    def _html_to_text(self, html: str) -> str:
        """Convertit HTML basique en texte"""
        text = re.sub(r'<br\s*/?>', '\n', html, flags=re.IGNORECASE)
        text = re.sub(r'<p\s*>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<[^>]+>', '', text)
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&amp;', '&')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&quot;', '"')
        return text.strip()
    
    def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html: bool = False,
        in_reply_to: Optional[str] = None,
        references: Optional[str] = None
    ) -> bool:
        """Envoie un email via SMTP"""
        try:
            logger.info(f"📤 Envoi email à {to}: {subject}")
            
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.smtp_from_name} <{self.smtp_user}>"
            msg['To'] = to
            msg['Subject'] = subject
            msg['Date'] = email.utils.formatdate(localtime=True)
            
            if in_reply_to:
                msg['In-Reply-To'] = in_reply_to
            if references:
                msg['References'] = references
            
            if html:
                msg.attach(MIMEText(body, 'html', 'utf-8'))
            else:
                msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            if self.smtp_use_tls:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port)
            
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"✅ Email envoyé avec succès à {to}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur envoi email: {e}")
            return False
    
    def test_connection(self) -> Dict[str, bool]:
        """Teste les connexions IMAP et SMTP"""
        results = {'imap': False, 'smtp': False}
        
        try:
            mail = self.connect_imap()
            mail.logout()
            results['imap'] = True
            logger.info("✅ Test IMAP réussi")
        except Exception as e:
            logger.error(f"❌ Test IMAP échoué: {e}")
        
        try:
            if self.smtp_use_tls:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port)
            
            server.login(self.smtp_user, self.smtp_password)
            server.quit()
            results['smtp'] = True
            logger.info("✅ Test SMTP réussi")
        except Exception as e:
            logger.error(f"❌ Test SMTP échoué: {e}")
        
        return results


if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()
    
    connector = EmailConnector()
    print("\n" + "="*60)
    print("🧪 TEST EMAIL CONNECTOR")
    print("="*60 + "\n")
    
    results = connector.test_connection()
    print(f"   IMAP: {'✅' if results['imap'] else '❌'}")
    print(f"   SMTP: {'✅' if results['smtp'] else '❌'}")
    
    if results['imap']:
        print("\n📬 Test récupération emails...")
        emails = connector.fetch_new_emails()
        print(f"   {len(emails)} nouveaux emails")
        
        for i, email_msg in enumerate(emails[:3], 1):
            print(f"\n   Email {i}:")
            print(f"   De: {email_msg.from_address}")
            print(f"   Sujet: {email_msg.subject}")
            print(f"   Corps: {email_msg.body[:100]}...")
    
    print("\n" + "="*60)
    print("✅ Tests terminés")
    print("="*60 + "\n")
