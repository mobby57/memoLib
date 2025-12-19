"""Gestion des destinataires"""
import json
import os
from datetime import datetime
from src.core.crypto_utils import _valider_chemin_securise, valider_email

RECIPIENTS_FILE = "recipients.json"

def get_recipients(app_dir):
    """Récupère la liste des destinataires"""
    path = _valider_chemin_securise(app_dir, RECIPIENTS_FILE)
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def add_recipient(app_dir, email, name=""):
    """Ajoute un destinataire"""
    if not valider_email(email):
        return False
    
    recipients = get_recipients(app_dir)
    
    # Vérifier si existe déjà
    if any(r['email'] == email for r in recipients):
        return True
    
    recipients.append({
        'email': email,
        'name': name,
        'added_at': datetime.now().isoformat(),
        'count': 1
    })
    
    path = _valider_chemin_securise(app_dir, RECIPIENTS_FILE)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(recipients, f, indent=2, ensure_ascii=False)
    
    return True

def increment_recipient(app_dir, email):
    """Incrémente le compteur d'un destinataire"""
    recipients = get_recipients(app_dir)
    
    for r in recipients:
        if r['email'] == email:
            r['count'] = r.get('count', 0) + 1
            r['last_sent'] = datetime.now().isoformat()
            break
    
    path = _valider_chemin_securise(app_dir, RECIPIENTS_FILE)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(recipients, f, indent=2, ensure_ascii=False)
