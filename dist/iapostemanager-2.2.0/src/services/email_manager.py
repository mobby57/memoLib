import imaplib
import email
from datetime import datetime, timedelta
import json
import re
from typing import List, Dict, Any
from dataclasses import dataclass
from ..core.database import get_db_connection
from ..security.secure_credentials import SecureCredentialManager
from ..services.email_classifier import EmailClassifier
from ..core.cache_manager import cache

@dataclass
class EmailFilter:
    date_from: str = None
    date_to: str = None
    domain: str = None
    sender: str = None
    subject_contains: str = None
    has_attachments: bool = None
    priority: str = None
    category: str = None

class EmailManager:
    def __init__(self, imap_server: str = None, email_addr: str = None, password: str = None):
        self.credential_manager = SecureCredentialManager()
        self.classifier = EmailClassifier()
        
        if imap_server and email_addr and password:
            self.imap_server = imap_server
            self.email_addr = email_addr
            self.password = password
        else:
            creds = self.credential_manager.decrypt_imap_credentials()
            if creds:
                self.imap_server = creds['imap_server']
                self.email_addr = creds['email']
                self.password = creds['password']
            else:
                raise ValueError("No credentials available")
        
        self.mail = None
    
    def connect(self):
        self.mail = imaplib.IMAP4_SSL(self.imap_server)
        self.mail.login(self.email_addr, self.password)
        return self.mail.select('inbox')
    
    def fetch_emails(self, limit: int = 100) -> List[Dict]:
        if not self.mail:
            self.connect()
        
        _, messages = self.mail.search(None, 'ALL')
        email_ids = messages[0].split()[-limit:]
        
        emails = []
        for email_id in email_ids:
            _, msg_data = self.mail.fetch(email_id, '(RFC822)')
            email_message = email.message_from_bytes(msg_data[0][1])
            
            email_data = {
                'id': email_id.decode(),
                'subject': email_message['Subject'] or '',
                'sender': email_message['From'] or '',
                'date': email_message['Date'] or '',
                'body': self._get_email_body(email_message),
                'domain': self._extract_domain(email_message['From'] or ''),
                'has_attachments': len(email_message.get_payload()) > 1 if email_message.is_multipart() else False,
                'category': self._ai_categorize(email_message),
                'priority': self._ai_priority(email_message)
            }
            emails.append(email_data)
            self._save_email(email_data)
        
        return emails
    
    def apply_filters(self, emails: List[Dict], filters: EmailFilter) -> List[Dict]:
        filtered = emails
        
        if filters.date_from:
            date_from = datetime.strptime(filters.date_from, '%Y-%m-%d')
            filtered = [e for e in filtered if self._parse_date(e['date']) >= date_from]
        
        if filters.date_to:
            date_to = datetime.strptime(filters.date_to, '%Y-%m-%d')
            filtered = [e for e in filtered if self._parse_date(e['date']) <= date_to]
        
        if filters.domain:
            filtered = [e for e in filtered if filters.domain.lower() in e['domain'].lower()]
        
        if filters.sender:
            filtered = [e for e in filtered if filters.sender.lower() in e['sender'].lower()]
        
        if filters.subject_contains:
            filtered = [e for e in filtered if filters.subject_contains.lower() in e['subject'].lower()]
        
        if filters.has_attachments is not None:
            filtered = [e for e in filtered if e['has_attachments'] == filters.has_attachments]
        
        if filters.priority:
            filtered = [e for e in filtered if e['priority'] == filters.priority]
        
        if filters.category:
            filtered = [e for e in filtered if e['category'] == filters.category]
        
        return filtered
    
    def _get_email_body(self, email_message) -> str:
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_type() == "text/plain":
                    return part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            return email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
        return ""
    
    def _extract_domain(self, email_addr: str) -> str:
        match = re.search(r'@([^>]+)', email_addr)
        return match.group(1) if match else ''
    
    def _parse_date(self, date_str: str) -> datetime:
        try:
            return email.utils.parsedate_to_datetime(date_str)
        except:
            return datetime.now()
    
    def _ai_categorize(self, email_message) -> str:
        subject = email_message['Subject'] or ''
        body = self._get_email_body(email_message)
        sender = email_message['From'] or ''
        
        return self.classifier.categorize_email(subject, body, sender)
    
    def _ai_priority(self, email_message) -> str:
        subject = email_message['Subject'] or ''
        body = self._get_email_body(email_message)
        
        return self.classifier.get_priority(subject, body)
    
    def _save_email(self, email_data: Dict):
        import sqlite3
        from ..core.config import Config
        conn = sqlite3.connect(f"{Config.APP_DIR}/app.db")
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO received_emails 
            (id, subject, sender, date, body, domain, has_attachments, category, priority, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            email_data['id'], email_data['subject'], email_data['sender'],
            email_data['date'], email_data['body'], email_data['domain'],
            email_data['has_attachments'], email_data['category'], 
            email_data['priority'], datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def get_smart_suggestions(self, emails: List[Dict]) -> Dict[str, Any]:
        """IA pour suggérer des filtres intelligents"""
        cache_key = f"suggestions_{len(emails)}_{hash(str(sorted([e['id'] for e in emails[:10]])))}"
        
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        domains = {}
        categories = {}
        senders = {}
        
        for email in emails:
            domains[email['domain']] = domains.get(email['domain'], 0) + 1
            categories[email['category']] = categories.get(email['category'], 0) + 1
            senders[email['sender']] = senders.get(email['sender'], 0) + 1
        
        result = {
            'top_domains': sorted(domains.items(), key=lambda x: x[1], reverse=True)[:5],
            'categories': sorted(categories.items(), key=lambda x: x[1], reverse=True),
            'frequent_senders': sorted(senders.items(), key=lambda x: x[1], reverse=True)[:10],
            'suggested_filters': self._generate_filter_suggestions(emails)
        }
        
        cache.set(cache_key, result)
        return result
    
    def _generate_filter_suggestions(self, emails: List[Dict]) -> List[Dict]:
        suggestions = []
        
        # Suggestion basée sur la fréquence
        recent_emails = [e for e in emails if self._parse_date(e['date']) > datetime.now() - timedelta(days=7)]
        
        if len(recent_emails) > 10:
            suggestions.append({
                'name': 'Emails récents (7 jours)',
                'filter': {'date_from': (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')},
                'count': len(recent_emails)
            })
        
        # Suggestion par priorité haute
        high_priority = [e for e in emails if e['priority'] == 'high']
        if high_priority:
            suggestions.append({
                'name': 'Priorité haute',
                'filter': {'priority': 'high'},
                'count': len(high_priority)
            })
        
        return suggestions