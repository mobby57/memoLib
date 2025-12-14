# -*- coding: utf-8 -*-
"""
Gestionnaire de destinataires - Refactorisé et sécurisé
"""

import re
import json
import os
from typing import List, Tuple, Dict

def valider_email(email: str) -> bool:
    """Valide le format d'un email"""
    if not email or not isinstance(email, str):
        return False
    email = email.strip()
    if len(email) > 254:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def nettoyer_email(email: str) -> str:
    """Nettoie et normalise un email"""
    if not email:
        return ""
    return email.strip().lower()

def parser_destinataires(destinataires_str: str) -> Tuple[List[str], List[str]]:
    """
    Parse une chaîne de destinataires et retourne (valides, invalides)
    Supporte: email1@test.com, email2@test.com; email3@test.com
    """
    if not destinataires_str:
        return [], []
    
    # Séparer par virgule ou point-virgule
    separateurs = [',', ';']
    emails = [destinataires_str]
    
    for sep in separateurs:
        temp = []
        for e in emails:
            temp.extend(e.split(sep))
        emails = temp
    
    valides = []
    invalides = []
    
    for email in emails:
        email_clean = nettoyer_email(email)
        if not email_clean:
            continue
        
        if valider_email(email_clean):
            if email_clean not in valides:  # Éviter doublons
                valides.append(email_clean)
        else:
            invalides.append(email_clean)
    
    return valides, invalides

def charger_destinataires_fichier(filepath: str) -> Tuple[List[str], List[str], str]:
    """
    Charge des destinataires depuis un fichier (CSV, TXT, JSON)
    Retourne (valides, invalides, erreur)
    """
    if not os.path.exists(filepath):
        return [], [], "Fichier introuvable"
    
    try:
        ext = os.path.splitext(filepath)[1].lower()
        
        if ext == '.json':
            return _charger_json(filepath)
        elif ext == '.csv':
            return _charger_csv(filepath)
        elif ext == '.txt':
            return _charger_txt(filepath)
        else:
            return [], [], f"Format non supporté: {ext}"
    
    except Exception as e:
        return [], [], f"Erreur de lecture: {str(e)}"

def _charger_json(filepath: str) -> Tuple[List[str], List[str], str]:
    """Charge depuis JSON"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    emails = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, str):
                emails.append(item)
            elif isinstance(item, dict) and 'email' in item:
                emails.append(item['email'])
    elif isinstance(data, dict) and 'emails' in data:
        emails = data['emails']
    
    valides, invalides = parser_destinataires(','.join(emails))
    return valides, invalides, ""

def _charger_csv(filepath: str) -> Tuple[List[str], List[str], str]:
    """Charge depuis CSV"""
    import csv
    emails = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if row:
                emails.append(row[0])
    
    valides, invalides = parser_destinataires(','.join(emails))
    return valides, invalides, ""

def _charger_txt(filepath: str) -> Tuple[List[str], List[str], str]:
    """Charge depuis TXT (un email par ligne)"""
    with open(filepath, 'r', encoding='utf-8') as f:
        emails = [line.strip() for line in f if line.strip()]
    
    valides, invalides = parser_destinataires(','.join(emails))
    return valides, invalides, ""

def sauvegarder_destinataires(emails: List[str], filepath: str) -> Tuple[bool, str]:
    """Sauvegarde une liste d'emails dans un fichier"""
    try:
        ext = os.path.splitext(filepath)[1].lower()
        
        if ext == '.json':
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump({'emails': emails}, f, indent=2)
        elif ext == '.csv':
            import csv
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                for email in emails:
                    writer.writerow([email])
        elif ext == '.txt':
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(emails))
        else:
            return False, f"Format non supporté: {ext}"
        
        return True, ""
    
    except Exception as e:
        return False, f"Erreur de sauvegarde: {str(e)}"

def valider_liste_destinataires(emails: List[str]) -> Dict[str, any]:
    """
    Valide une liste complète de destinataires
    Retourne un dictionnaire avec statistiques
    """
    stats = {
        'total': len(emails),
        'valides': [],
        'invalides': [],
        'doublons': [],
        'vides': 0
    }
    
    vus = set()
    
    for email in emails:
        if not email or not email.strip():
            stats['vides'] += 1
            continue
        
        email_clean = nettoyer_email(email)
        
        if email_clean in vus:
            stats['doublons'].append(email_clean)
            continue
        
        vus.add(email_clean)
        
        if valider_email(email_clean):
            stats['valides'].append(email_clean)
        else:
            stats['invalides'].append(email_clean)
    
    return stats

def formater_pour_envoi(emails: List[str]) -> str:
    """Formate une liste d'emails pour l'envoi (séparés par virgule)"""
    return ', '.join(emails)
