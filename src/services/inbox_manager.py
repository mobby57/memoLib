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
                    
                    # Créer un aperçu lisible du contenu
                    preview = self.create_readable_preview(body)
                    
                    email_data = {
                        'id': message_id or f"email_{email_id.decode()}",
                        'subject': subject or 'Sans sujet',
                        'sender': sender or 'Expéditeur inconnu',
                        'date': date_str,
                        'body': body,  # Corps complet
                        'preview': preview,  # Aperçu formaté
                        'has_attachments': self.has_attachments(email_message),
                        'read': False,
                        'replied': False,
                        'tags': [],
                        'notes': '',
                        'fetched_at': datetime.now().isoformat(),
                        'formatted_date': self.format_date_human(date_str)
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
        """Extrait le corps du message avec formatage lisible"""
        body = ""
        html_body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                
                if content_type == "text/plain":
                    try:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        continue
                elif content_type == "text/html":
                    try:
                        html_body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        continue
        else:
            try:
                content_type = email_message.get_content_type()
                payload = email_message.get_payload(decode=True)
                
                if payload:
                    decoded_content = payload.decode('utf-8', errors='ignore')
                    if content_type == "text/html":
                        html_body = decoded_content
                    else:
                        body = decoded_content
                else:
                    body = str(email_message.get_payload())
            except:
                body = str(email_message.get_payload())
        
        # Préférer le texte brut, sinon convertir HTML en texte lisible
        if body:
            formatted_body = self.format_plain_text(body)
        elif html_body:
            formatted_body = self.html_to_readable_text(html_body)
        else:
            formatted_body = "[Contenu non disponible]"
        
        return formatted_body.strip()
    
    def has_attachments(self, email_message):
        """Vérifie si l'email a des pièces jointes"""
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_disposition() == 'attachment':
                    return True
        return False
    
    def create_readable_preview(self, body, max_length=200):
        """Crée un aperçu lisible du contenu de l'email"""
        if not body:
            return "[Aucun contenu]"
        
        # Nettoyer le texte
        preview = body.strip()
        
        # Supprimer les lignes vides au début
        lines = preview.split('\n')
        non_empty_lines = [line.strip() for line in lines if line.strip()]
        
        if not non_empty_lines:
            return "[Contenu vide]"
        
        # Prendre les premières lignes significatives
        preview_text = ' '.join(non_empty_lines[:3])  # Max 3 lignes
        
        # Tronquer si trop long
        if len(preview_text) > max_length:
            preview_text = preview_text[:max_length].rsplit(' ', 1)[0] + '...'
        
        return preview_text
    
    def format_date_human(self, date_str):
        """Formate la date de manière lisible"""
        try:
            from email.utils import parsedate_to_datetime
            date_obj = parsedate_to_datetime(date_str)
            
            now = datetime.now(date_obj.tzinfo)
            diff = now - date_obj
            
            if diff.days == 0:
                if diff.seconds < 3600:  # Moins d'1 heure
                    minutes = diff.seconds // 60
                    return f"Il y a {minutes} minute{'s' if minutes > 1 else ''}"
                else:  # Moins d'1 jour
                    hours = diff.seconds // 3600
                    return f"Il y a {hours} heure{'s' if hours > 1 else ''}"
            elif diff.days == 1:
                return "Hier à " + date_obj.strftime("%H:%M")
            elif diff.days < 7:
                return date_obj.strftime("%A à %H:%M")
            else:
                return date_obj.strftime("%d/%m/%Y à %H:%M")
                
        except Exception:
            return date_str or "Date inconnue"
    
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
    
    def format_plain_text(self, text):
        """Formate le texte brut pour une meilleure lisibilité"""
        if not text:
            return ""
        
        # Nettoyer les caractères indésirables
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        # Supprimer les lignes vides excessives
        lines = text.split('\n')
        cleaned_lines = []
        empty_count = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                empty_count += 1
                if empty_count <= 2:  # Garder max 2 lignes vides consécutives
                    cleaned_lines.append('')
            else:
                empty_count = 0
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def html_to_readable_text(self, html_content):
        """Convertit HTML en texte lisible"""
        try:
            import re
            
            # Supprimer les balises script et style
            html_content = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
            
            # Remplacer les balises de paragraphe par des sauts de ligne
            html_content = re.sub(r'</(p|div|br)>', '\n', html_content, flags=re.IGNORECASE)
            html_content = re.sub(r'<br[^>]*>', '\n', html_content, flags=re.IGNORECASE)
            
            # Remplacer les listes
            html_content = re.sub(r'<li[^>]*>', '• ', html_content, flags=re.IGNORECASE)
            html_content = re.sub(r'</li>', '\n', html_content, flags=re.IGNORECASE)
            
            # Remplacer les titres
            html_content = re.sub(r'<h[1-6][^>]*>', '\n=== ', html_content, flags=re.IGNORECASE)
            html_content = re.sub(r'</h[1-6]>', ' ===\n', html_content, flags=re.IGNORECASE)
            
            # Supprimer toutes les autres balises HTML
            html_content = re.sub(r'<[^>]+>', '', html_content)
            
            # Décoder les entités HTML
            html_content = html_content.replace('&nbsp;', ' ')
            html_content = html_content.replace('&amp;', '&')
            html_content = html_content.replace('&lt;', '<')
            html_content = html_content.replace('&gt;', '>')
            html_content = html_content.replace('&quot;', '"')
            html_content = html_content.replace('&#39;', "'")
            
            return self.format_plain_text(html_content)
            
        except Exception as e:
            print(f"Erreur conversion HTML: {e}")
            return html_content
    
    def get_thread(self, message_id):
        """Récupère tous les emails d'un fil de discussion"""
        # Implémentation simplifiée - retourne juste l'email
        for email in self.emails:
            if email['id'] == message_id:
                return [email]
        return []