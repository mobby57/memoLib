# -*- coding: utf-8 -*-
"""
Système d'authentification et d'inscription des utilisateurs
"""

import os, json, hashlib, secrets
from datetime import datetime

USERS_FILE = "users.json"

def hash_password(password):
    """Hash un mot de passe avec SHA-256"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def generer_mot_de_passe():
    """Génère un mot de passe aléatoire sécurisé"""
    return secrets.token_urlsafe(12)

def valider_force_mot_de_passe(password):
    """Valide la force du mot de passe"""
    if len(password) < 8:
        return False, "Minimum 8 caractères"
    if not any(c.isupper() for c in password):
        return False, "Au moins une majuscule"
    if not any(c.islower() for c in password):
        return False, "Au moins une minuscule"
    if not any(c.isdigit() for c in password):
        return False, "Au moins un chiffre"
    return True, "Mot de passe valide"

def charger_utilisateurs(app_dir):
    """Charge la liste des utilisateurs"""
    path = os.path.join(app_dir, USERS_FILE)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def sauvegarder_utilisateurs(users, app_dir):
    """Sauvegarde la liste des utilisateurs"""
    path = os.path.join(app_dir, USERS_FILE)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def inscrire_utilisateur(email, nom, password, app_dir):
    """Inscrit un nouvel utilisateur avec son propre mot de passe"""
    users = charger_utilisateurs(app_dir)
    
    if email in users:
        return False, "Cet email est déjà inscrit"
    
    # Valider le mot de passe
    valide, message = valider_force_mot_de_passe(password)
    if not valide:
        return False, message
    
    users[email] = {
        'nom': nom,
        'password_hash': hash_password(password),
        'date_inscription': datetime.now().isoformat(),
        'actif': True,
        'abonnement': 'gratuit',
        'date_expiration': None
    }
    
    sauvegarder_utilisateurs(users, app_dir)
    return True, None

def authentifier_utilisateur(email, password, app_dir):
    """Authentifie un utilisateur"""
    users = charger_utilisateurs(app_dir)
    
    if email not in users:
        return False, "Email non trouvé"
    
    user = users[email]
    if not user.get('actif', True):
        return False, "Compte désactivé"
    
    if user['password_hash'] == hash_password(password):
        return True, user['nom']
    
    return False, "Mot de passe incorrect"

def utilisateur_existe(email, app_dir):
    """Vérifie si un utilisateur existe"""
    users = charger_utilisateurs(app_dir)
    return email in users
