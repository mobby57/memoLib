"""
Service de génération d'adresses email génériques
"""
import random
import string
import json
import os
from datetime import datetime, timedelta

class EmailGenerator:
    def __init__(self, domain="iaposte.cloud"):
        self.domain = domain
        self.generated_emails = {}
        self.load_generated_emails()
    
    def load_generated_emails(self):
        """Charger les emails générés depuis le fichier"""
        try:
            emails_file = os.path.join(os.path.dirname(__file__), 'data', 'generated_emails.json')
            if os.path.exists(emails_file):
                with open(emails_file, 'r') as f:
                    self.generated_emails = json.load(f)
        except:
            self.generated_emails = {}
    
    def save_generated_emails(self):
        """Sauvegarder les emails générés"""
        try:
            os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
            emails_file = os.path.join(os.path.dirname(__file__), 'data', 'generated_emails.json')
            with open(emails_file, 'w') as f:
                json.dump(self.generated_emails, f, indent=2)
        except Exception as e:
            print(f"Erreur sauvegarde emails: {e}")
    
    def generate_random_email(self, prefix="user", length=8):
        """Générer une adresse email aléatoire"""
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
        email = f"{prefix}{suffix}@{self.domain}"
        
        # Vérifier unicité
        while email in self.generated_emails:
            suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
            email = f"{prefix}{suffix}@{self.domain}"
        
        return email
    
    def create_email(self, purpose="general", duration_hours=24, custom_name=None):
        """Créer une nouvelle adresse email générique"""
        if custom_name:
            # Nettoyer le nom personnalisé
            clean_name = ''.join(c for c in custom_name.lower() if c.isalnum())[:20]
            email = f"{clean_name}@{self.domain}"
            
            # Ajouter un suffixe si déjà pris
            counter = 1
            original_email = email
            while email in self.generated_emails:
                email = f"{clean_name}{counter}@{self.domain}"
                counter += 1
        else:
            # Générer selon le type
            prefixes = {
                "general": "user",
                "support": "support",
                "contact": "contact", 
                "info": "info",
                "noreply": "noreply",
                "temp": "temp",
                "test": "test"
            }
            prefix = prefixes.get(purpose, "user")
            email = self.generate_random_email(prefix)
        
        # Créer l'entrée
        email_data = {
            "email": email,
            "purpose": purpose,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(hours=duration_hours)).isoformat(),
            "active": True,
            "usage_count": 0,
            "forwarding_enabled": True,
            "auto_reply": None
        }
        
        self.generated_emails[email] = email_data
        self.save_generated_emails()
        
        return email_data
    
    def get_email_info(self, email):
        """Obtenir les informations d'une adresse email"""
        return self.generated_emails.get(email)
    
    def list_active_emails(self):
        """Lister toutes les adresses actives"""
        now = datetime.now()
        active_emails = []
        
        for email, data in self.generated_emails.items():
            expires_at = datetime.fromisoformat(data["expires_at"])
            if data["active"] and expires_at > now:
                active_emails.append(data)
        
        return active_emails
    
    def deactivate_email(self, email):
        """Désactiver une adresse email"""
        if email in self.generated_emails:
            self.generated_emails[email]["active"] = False
            self.save_generated_emails()
            return True
        return False
    
    def extend_email(self, email, additional_hours=24):
        """Prolonger la durée de vie d'une adresse"""
        if email in self.generated_emails:
            current_expires = datetime.fromisoformat(self.generated_emails[email]["expires_at"])
            new_expires = current_expires + timedelta(hours=additional_hours)
            self.generated_emails[email]["expires_at"] = new_expires.isoformat()
            self.save_generated_emails()
            return True
        return False
    
    def cleanup_expired(self):
        """Nettoyer les adresses expirées"""
        now = datetime.now()
        expired_emails = []
        
        for email, data in list(self.generated_emails.items()):
            expires_at = datetime.fromisoformat(data["expires_at"])
            if expires_at < now:
                expired_emails.append(email)
                del self.generated_emails[email]
        
        if expired_emails:
            self.save_generated_emails()
        
        return expired_emails