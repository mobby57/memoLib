"""
Service de transfert d'emails pour les adresses génériques
"""
import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import os
from datetime import datetime
import threading
import time

class EmailForwardingService:
    def __init__(self, smtp_config, imap_config):
        self.smtp_config = smtp_config
        self.imap_config = imap_config
        self.forwarding_rules = {}
        self.load_forwarding_rules()
        self.running = False
        
    def load_forwarding_rules(self):
        """Charger les règles de transfert"""
        try:
            rules_file = os.path.join(os.path.dirname(__file__), 'data', 'forwarding_rules.json')
            if os.path.exists(rules_file):
                with open(rules_file, 'r') as f:
                    self.forwarding_rules = json.load(f)
        except:
            self.forwarding_rules = {}
    
    def save_forwarding_rules(self):
        """Sauvegarder les règles de transfert"""
        try:
            os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
            rules_file = os.path.join(os.path.dirname(__file__), 'data', 'forwarding_rules.json')
            with open(rules_file, 'w') as f:
                json.dump(self.forwarding_rules, f, indent=2)
        except Exception as e:
            print(f"Erreur sauvegarde règles: {e}")
    
    def add_forwarding_rule(self, from_email, to_email, auto_reply=None):
        """Ajouter une règle de transfert"""
        self.forwarding_rules[from_email] = {
            'to': to_email,
            'auto_reply': auto_reply,
            'created_at': datetime.now().isoformat(),
            'active': True,
            'forwarded_count': 0
        }
        self.save_forwarding_rules()
    
    def remove_forwarding_rule(self, from_email):
        """Supprimer une règle de transfert"""
        if from_email in self.forwarding_rules:
            del self.forwarding_rules[from_email]
            self.save_forwarding_rules()
    
    def forward_email(self, original_msg, from_email, to_email):
        """Transférer un email"""
        try:
            # Créer le message de transfert
            forward_msg = MIMEMultipart()
            forward_msg['From'] = self.smtp_config['email']
            forward_msg['To'] = to_email
            forward_msg['Subject'] = f"[Transféré de {from_email}] {original_msg.get('Subject', 'Sans sujet')}"
            
            # Corps du message
            body = f"""
Email transféré automatiquement depuis: {from_email}
Date originale: {original_msg.get('Date', 'Inconnue')}
Expéditeur original: {original_msg.get('From', 'Inconnu')}

--- Message original ---
{self.get_email_body(original_msg)}
            """
            
            forward_msg.attach(MIMEText(body, 'plain'))
            
            # Envoyer
            with smtplib.SMTP(self.smtp_config['server'], self.smtp_config['port']) as server:
                server.starttls()
                server.login(self.smtp_config['email'], self.smtp_config['password'])
                server.send_message(forward_msg)
            
            # Mettre à jour le compteur
            if from_email in self.forwarding_rules:
                self.forwarding_rules[from_email]['forwarded_count'] += 1
                self.save_forwarding_rules()
            
            return True
        except Exception as e:
            print(f"Erreur transfert email: {e}")
            return False
    
    def get_email_body(self, msg):
        """Extraire le corps d'un email"""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    return part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            return msg.get_payload(decode=True).decode('utf-8', errors='ignore')
        return ""
    
    def send_auto_reply(self, to_email, from_email, auto_reply_text):
        """Envoyer une réponse automatique"""
        try:
            reply_msg = MIMEText(auto_reply_text, 'plain')
            reply_msg['From'] = from_email
            reply_msg['To'] = to_email
            reply_msg['Subject'] = "Réponse automatique"
            
            with smtplib.SMTP(self.smtp_config['server'], self.smtp_config['port']) as server:
                server.starttls()
                server.login(self.smtp_config['email'], self.smtp_config['password'])
                server.send_message(reply_msg)
            
            return True
        except Exception as e:
            print(f"Erreur réponse auto: {e}")
            return False
    
    def check_emails(self):
        """Vérifier les nouveaux emails"""
        try:
            with imaplib.IMAP4_SSL(self.imap_config['server']) as mail:
                mail.login(self.imap_config['email'], self.imap_config['password'])
                mail.select('INBOX')
                
                # Chercher les emails non lus
                status, messages = mail.search(None, 'UNSEEN')
                
                for msg_id in messages[0].split():
                    status, msg_data = mail.fetch(msg_id, '(RFC822)')
                    email_msg = email.message_from_bytes(msg_data[0][1])
                    
                    # Vérifier si c'est pour une adresse générique
                    to_address = email_msg.get('To', '').lower()
                    
                    for generic_email, rule in self.forwarding_rules.items():
                        if generic_email.lower() in to_address and rule['active']:
                            # Transférer l'email
                            self.forward_email(email_msg, generic_email, rule['to'])
                            
                            # Réponse automatique si configurée
                            if rule.get('auto_reply'):
                                sender = email_msg.get('From', '')
                                self.send_auto_reply(sender, generic_email, rule['auto_reply'])
                            
                            break
                    
                    # Marquer comme lu
                    mail.store(msg_id, '+FLAGS', '\\Seen')
        
        except Exception as e:
            print(f"Erreur vérification emails: {e}")
    
    def start_monitoring(self):
        """Démarrer la surveillance des emails"""
        self.running = True
        
        def monitor_loop():
            while self.running:
                self.check_emails()
                time.sleep(30)  # Vérifier toutes les 30 secondes
        
        thread = threading.Thread(target=monitor_loop, daemon=True)
        thread.start()
    
    def stop_monitoring(self):
        """Arrêter la surveillance"""
        self.running = False