# -*- coding: utf-8 -*-
"""
Système de paiement et gestion des abonnements
"""

import os, json
from datetime import datetime, timedelta

PLANS = {
    'gratuit': {
        'nom': 'Gratuit',
        'prix': 0,
        'fonctionnalites': ['envoi_emails', 'historique'],
        'limite_emails': 10
    },
    'premium': {
        'nom': 'Premium',
        'prix': 9.99,
        'fonctionnalites': ['envoi_emails', 'historique', 'ia_generation', 'templates', 'google_drive'],
        'limite_emails': -1
    },
    'pro': {
        'nom': 'Pro',
        'prix': 19.99,
        'fonctionnalites': ['envoi_emails', 'historique', 'ia_generation', 'templates', 'google_drive', 'envoi_masse', 'api_access'],
        'limite_emails': -1
    }
}

def verifier_abonnement(email, app_dir):
    """Vérifie le statut d'abonnement d'un utilisateur"""
    from user_auth import charger_utilisateurs
    users = charger_utilisateurs(app_dir)
    
    if email not in users:
        return 'gratuit', False
    
    user = users[email]
    plan = user.get('abonnement', 'gratuit')
    
    if plan == 'gratuit':
        return plan, True
    
    date_exp = user.get('date_expiration')
    if date_exp:
        expiration = datetime.fromisoformat(date_exp)
        if datetime.now() > expiration:
            return 'gratuit', False
    
    return plan, True

def a_acces_fonctionnalite(email, fonctionnalite, app_dir):
    """Vérifie si l'utilisateur a accès à une fonctionnalité"""
    plan, actif = verifier_abonnement(email, app_dir)
    if not actif:
        return False
    return fonctionnalite in PLANS[plan]['fonctionnalites']

def activer_abonnement(email, plan, duree_mois, app_dir):
    """Active un abonnement pour un utilisateur"""
    from user_auth import charger_utilisateurs, sauvegarder_utilisateurs
    users = charger_utilisateurs(app_dir)
    
    if email not in users:
        return False, "Utilisateur non trouvé"
    
    if plan not in PLANS:
        return False, "Plan invalide"
    
    date_expiration = datetime.now() + timedelta(days=30 * duree_mois)
    
    users[email]['abonnement'] = plan
    users[email]['date_expiration'] = date_expiration.isoformat()
    users[email]['date_paiement'] = datetime.now().isoformat()
    
    sauvegarder_utilisateurs(users, app_dir)
    return True, f"Abonnement {plan} activé jusqu'au {date_expiration.strftime('%d/%m/%Y')}"

def obtenir_info_plan(plan):
    """Retourne les informations d'un plan"""
    return PLANS.get(plan, PLANS['gratuit'])
