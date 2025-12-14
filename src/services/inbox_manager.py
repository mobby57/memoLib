"""Gestionnaire de boîte de réception"""
import imaplib
import email
import json
import os
from datetime import datetime, timedelta
from email.header import decode_header

class InboxManager:
    def __init__(self, app_dir):
        self.app_dir = app_dir
        self.emails = []
        self.threads = {}
        self.inbox_file = os.path.join(app_dir, 'inbox_cache.json')
        self.load_cached_emails()
    
    def load_cached_emails(self):
        """Charge les emails en cache"""
        if os.path.exists(self.inbox_file):
            try:
                with open(self.inbox_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.emails = data.get('emails', [])
                    self.threads = data.get('threads', {})
            except:
                self.emails = []
                self.threads = {}
    
    def save_cached_emails(self):
        """Sauvegarde les emails en cache"""
        try:
            with open(self.inbox_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'emails': self.emails,
                    'threads': self.threads,
                    'last_update': datetime.now().isoformat()
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Erreur sauvegarde cache inbox: {e}")
    
    def fetch_emails(self, email_address, app_password, days_back=30):
        """Récupère les emails depuis Gmail via IMAP"""
        try:
            # Connexion IMAP
            mail = imaplib.IMAP4_SSL('imap.gmail.com')
            mail.login(email_address, app_password)
            mail.select('inbox')
            
            # Recherche des emails récents
            since_date = (datetime.now() - timedelta(days=days_back)).strftime('%d-%b-%Y')
            result, data = mail.search(None, f'SINCE {since_date}')
            
            email_ids = data[0].split()
            fetched_emails = []
            
            # Limiter à 100 emails pour éviter la surcharge
            for email_id in email_ids[-100:]:
                try:
                    result, msg_data = mail.fetch(email_id, '(RFC822)')
                    raw_email = msg_data[0][1]
                    email_message = email.message_from_bytes(raw_email)
                    
                    # Extraire les informations
                    subject = self.decode_header_value(email_message['Subject'])
                    sender = self.decode_header_value(email_message['From'])
                    date_str = email_message['Date']
                    message_id = email_message['Message-ID']
                    
                    # Corps du message
                    body = self.extract_body(email_message)
                    
                    email_data = {
                        'id': message_id or f"email_{email_id.decode()}",
                        'subject': subject or 'Sans sujet',
                        'sender': sender or 'Expéditeur inconnu',
                        'date': date_str,
                        'body': body[:1000] + '...' if len(body) > 1000 else body,
                        'has_attachments': self.has_attachments(email_message),
                        'read': False,
                        'replied': False,
                        'tags': [],
                        'notes': '',
                        'fetched_at': datetime.now().isoformat()
                    }
                    
                    fetched_emails.append(email_data)
                    
                except Exception as e:
                    print(f"Erreur traitement email {email_id}: {e}")
                    continue
            
            mail.close()
            mail.logout()
            
            # Fusionner avec les emails existants
            existing_ids = {email['id'] for email in self.emails}
            new_emails = [email for email in fetched_emails if email['id'] not in existing_ids]
            
            self.emails.extend(new_emails)
            self.save_cached_emails()
            
            return new_emails
            
        except Exception as e:
            print(f"Erreur récupération emails: {e}")
            return []
    
    def decode_header_value(self, value):
        """Décode les headers d'email"""
        if not value:
            return ""
        
        try:
            decoded_parts = decode_header(value)
            decoded_value = ""
            for part, encoding in decoded_parts:
                if isinstance(part, bytes):
                    decoded_value += part.decode(encoding or 'utf-8', errors='ignore')
                else:
                    decoded_value += part
            return decoded_value
        except:
            return str(value)
    
    def extract_body(self, email_message):
        """Extrait le corps du message"""
        body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                        break
                    except:
                        continue
        else:
            try:
                body = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
            except:
                body = str(email_message.get_payload())
        
        return body.strip()
    
    def has_attachments(self, email_message):
        """Vérifie si l'email a des pièces jointes"""
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_disposition() == 'attachment':
                    return True
        return False
    
    def get_statistics(self):
        """Retourne les statistiques de la boîte de réception"""
        total = len(self.emails)
        unread = len([e for e in self.emails if not e.get('read', False)])
        with_attachments = len([e for e in self.emails if e.get('has_attachments', False)])
        
        return {
            'total_emails': total,
            'unread_emails': unread,
            'read_emails': total - unread,
            'emails_with_attachments': with_attachments,
            'last_sync': datetime.now().isoformat()
        }
    
    def filter_emails(self, filters):
        """Filtre les emails selon des critères"""
        filtered = self.emails
        
        if filters.get('unread_only'):
            filtered = [e for e in filtered if not e.get('read', False)]
        
        if filters.get('sender'):
            sender = filters['sender'].lower()
            filtered = [e for e in filtered if sender in e.get('sender', '').lower()]
        
        if filters.get('subject'):
            subject = filters['subject'].lower()
            filtered = [e for e in filtered if subject in e.get('subject', '').lower()]
        
        if filters.get('has_attachments'):
            filtered = [e for e in filtered if e.get('has_attachments', False)]
        
        return filtered
    
    def mark_as_read(self, message_id):
        """Marque un email comme lu"""
        for email in self.emails:
            if email['id'] == message_id:
                email['read'] = True
                break
        self.save_cached_emails()
    
    def mark_as_replied(self, message_id):
        """Marque un email comme répondu"""
        for email in self.emails:
            if email['id'] == message_id:
                email['replied'] = True
                break
        self.save_cached_emails()
    
    def add_tag(self, message_id, tag):
        """Ajoute un tag à un email"""
        for email in self.emails:
            if email['id'] == message_id:
                if 'tags' not in email:
                    email['tags'] = []
                if tag not in email['tags']:
                    email['tags'].append(tag)
                break
        self.save_cached_emails()
    
    def add_note(self, message_id, note):
        """Ajoute une note à un email"""
        for email in self.emails:
            if email['id'] == message_id:
                email['notes'] = note
                break
        self.save_cached_emails()
    
    def get_thread(self, message_id):
        """Récupère tous les emails d'un fil de discussion"""
        # Implémentation simplifiée - retourne juste l'email
        for email in self.emails:
            if email['id'] == message_id:
                return [email]
        return []