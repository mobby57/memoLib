#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Module d'automatisation d'envoi d'emails avec validation
"""
import re, csv, json, os
from datetime import datetime

def valider_email(email):
    """Valide le format d'une adresse email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email.strip()) is not None

def extraire_donnees_email(email):
    """Extrait nom et domaine depuis une adresse email"""
    if not valider_email(email):
        return None
    email = email.strip().lower()
    username, domain = email.split('@')
    return {
        'email': email,
        'username': username,
        'domain': domain,
        'nom_probable': username.replace('.', ' ').replace('_', ' ').title()
    }

def charger_emails_depuis_fichier(filepath):
    """Charge les emails depuis CSV, TXT ou JSON"""
    emails = []
    ext = os.path.splitext(filepath)[1].lower()
    
    if ext == '.csv':
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                email = row.get('email', '').strip()
                if valider_email(email):
                    data = extraire_donnees_email(email)
                    data.update({k: v for k, v in row.items() if k != 'email'})
                    emails.append(data)
    
    elif ext == '.txt':
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                email = line.strip()
                if valider_email(email):
                    emails.append(extraire_donnees_email(email))
    
    elif ext == '.json':
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for item in data:
                email = item.get('email', '').strip()
                if valider_email(email):
                    info = extraire_donnees_email(email)
                    info.update({k: v for k, v in item.items() if k != 'email'})
                    emails.append(info)
    
    return emails

def generer_email_personnalise(template, data):
    """Génère un email personnalisé depuis un template"""
    sujet = template['sujet']
    corps = template['corps']
    
    for key, value in data.items():
        sujet = sujet.replace(f'{{{key}}}', str(value))
        corps = corps.replace(f'{{{key}}}', str(value))
    
    return sujet, corps

class EmailQueue:
    """Gère la file d'attente d'emails avec validation"""
    
    def __init__(self):
        self.queue = []
        self.sent = []
        self.failed = []
    
    def ajouter(self, destinataire, sujet, corps, data=None):
        """Ajoute un email à la file"""
        if not valider_email(destinataire):
            return False
        self.queue.append({
            'destinataire': destinataire,
            'sujet': sujet,
            'corps': corps,
            'data': data or {},
            'timestamp': datetime.now().isoformat()
        })
        return True
    
    def valider_queue(self):
        """Retourne les emails valides prêts à être envoyés"""
        return [e for e in self.queue if valider_email(e['destinataire'])]
    
    def marquer_envoye(self, email):
        """Marque un email comme envoyé"""
        if email in self.queue:
            self.queue.remove(email)
            self.sent.append({**email, 'sent_at': datetime.now().isoformat()})
    
    def marquer_echec(self, email, erreur):
        """Marque un email comme échoué"""
        if email in self.queue:
            self.queue.remove(email)
            self.failed.append({**email, 'error': erreur, 'failed_at': datetime.now().isoformat()})
    
    def exporter_rapport(self, filepath):
        """Exporte un rapport d'envoi"""
        rapport = {
            'date': datetime.now().isoformat(),
            'total': len(self.sent) + len(self.failed),
            'envoyes': len(self.sent),
            'echecs': len(self.failed),
            'details_envoyes': self.sent,
            'details_echecs': self.failed
        }
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(rapport, f, indent=2, ensure_ascii=False)
