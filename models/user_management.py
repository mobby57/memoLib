# -*- coding: utf-8 -*-
"""
Module de gestion des utilisateurs avec système admin
"""

import os, json, secrets, hashlib, logging
from datetime import datetime
from crypto_utils import sanitize_input, valider_email

logger = logging.getLogger(__name__)

USERS_FILE = "users.json"
ADMINS_FILE = "admins.json"

def generer_user_id():
    """Génère un ID utilisateur unique"""
    return secrets.token_hex(16)

def hasher_password(password):
    """Hash un mot de passe avec SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def creer_admin(app_dir, email, password, nom):
    """Crée un compte administrateur"""
    email = sanitize_input(email, max_length=254)
    nom = sanitize_input(nom, max_length=100)
    
    if not valider_email(email):
        return False, "Email invalide"
    
    admins_path = os.path.join(app_dir, ADMINS_FILE)
    admins = {}
    
    if os.path.exists(admins_path):
        with open(admins_path, 'r') as f:
            admins = json.load(f)
    
    if email in admins:
        return False, "Admin existe déjà"
    
    admin_id = generer_user_id()
    admins[email] = {
        'id': admin_id,
        'nom': nom,
        'password_hash': hasher_password(password),
        'created_at': datetime.now().isoformat(),
        'users_geres': []
    }
    
    with open(admins_path, 'w') as f:
        json.dump(admins, f, indent=2)
    
    logger.info(f"Admin créé: {email}")
    return True, admin_id

def authentifier_admin(app_dir, email, password):
    """Authentifie un administrateur"""
    admins_path = os.path.join(app_dir, ADMINS_FILE)
    
    if not os.path.exists(admins_path):
        return False, None
    
    with open(admins_path, 'r') as f:
        admins = json.load(f)
    
    if email not in admins:
        return False, None
    
    if admins[email]['password_hash'] == hasher_password(password):
        return True, admins[email]['id']
    
    return False, None

def creer_utilisateur(app_dir, admin_id, email, nom, role="user"):
    """Crée un utilisateur lié à un admin"""
    email = sanitize_input(email, max_length=254)
    nom = sanitize_input(nom, max_length=100)
    
    if not valider_email(email):
        return False, "Email invalide", None
    
    users_path = os.path.join(app_dir, USERS_FILE)
    users = {}
    
    if os.path.exists(users_path):
        with open(users_path, 'r') as f:
            users = json.load(f)
    
    if email in users:
        return False, "Utilisateur existe déjà", None
    
    user_id = generer_user_id()
    users[email] = {
        'id': user_id,
        'nom': nom,
        'role': role,
        'admin_id': admin_id,
        'created_at': datetime.now().isoformat(),
        'actif': True
    }
    
    with open(users_path, 'w') as f:
        json.dump(users, f, indent=2)
    
    # Ajouter à la liste des users gérés par l'admin
    admins_path = os.path.join(app_dir, ADMINS_FILE)
    with open(admins_path, 'r') as f:
        admins = json.load(f)
    
    for admin_email, admin_data in admins.items():
        if admin_data['id'] == admin_id:
            admin_data['users_geres'].append(user_id)
            break
    
    with open(admins_path, 'w') as f:
        json.dump(admins, f, indent=2)
    
    logger.info(f"Utilisateur créé: {email} par admin {admin_id}")
    return True, "Utilisateur créé", user_id

def lister_utilisateurs_admin(app_dir, admin_id):
    """Liste tous les utilisateurs gérés par un admin"""
    users_path = os.path.join(app_dir, USERS_FILE)
    
    if not os.path.exists(users_path):
        return []
    
    with open(users_path, 'r') as f:
        users = json.load(f)
    
    return [
        {
            'email': email,
            'id': data['id'],
            'nom': data['nom'],
            'role': data['role'],
            'created_at': data['created_at'],
            'actif': data['actif']
        }
        for email, data in users.items()
        if data.get('admin_id') == admin_id
    ]

def obtenir_utilisateur(app_dir, user_id):
    """Récupère les infos d'un utilisateur par ID"""
    users_path = os.path.join(app_dir, USERS_FILE)
    
    if not os.path.exists(users_path):
        return None
    
    with open(users_path, 'r') as f:
        users = json.load(f)
    
    for email, data in users.items():
        if data['id'] == user_id:
            return {'email': email, **data}
    
    return None

def desactiver_utilisateur(app_dir, admin_id, user_id):
    """Désactive un utilisateur"""
    users_path = os.path.join(app_dir, USERS_FILE)
    
    if not os.path.exists(users_path):
        return False, "Aucun utilisateur"
    
    with open(users_path, 'r') as f:
        users = json.load(f)
    
    for email, data in users.items():
        if data['id'] == user_id and data['admin_id'] == admin_id:
            data['actif'] = False
            with open(users_path, 'w') as f:
                json.dump(users, f, indent=2)
            logger.info(f"Utilisateur désactivé: {user_id}")
            return True, "Utilisateur désactivé"
    
    return False, "Utilisateur non trouvé ou non autorisé"

def obtenir_admin_par_id(app_dir, admin_id):
    """Récupère les infos d'un admin par ID"""
    admins_path = os.path.join(app_dir, ADMINS_FILE)
    
    if not os.path.exists(admins_path):
        return None
    
    with open(admins_path, 'r') as f:
        admins = json.load(f)
    
    for email, data in admins.items():
        if data['id'] == admin_id:
            return {'email': email, **data}
    
    return None
