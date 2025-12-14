#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Système d'inscription utilisateur avec envoi du mot de passe par email
"""
import sqlite3, os, secrets, string
from datetime import datetime
from main import envoyer_mail_gmail

DB_PATH = "users.db"

def init_users_db():
    """Initialise la base de données utilisateurs"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            app_password TEXT NOT NULL,
            created_at TEXT,
            last_login TEXT
        )
    """)
    conn.commit()
    conn.close()

def generer_app_password():
    """Génère un mot de passe d'application aléatoire"""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(16))

def inscrire_utilisateur(email, admin_email, admin_app_password):
    """Inscrit un utilisateur et lui envoie son mot de passe par email"""
    init_users_db()
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Vérifier si existe déjà
    cur.execute("SELECT email FROM users WHERE email=?", (email,))
    if cur.fetchone():
        conn.close()
        return False, "Cet email est déjà inscrit"
    
    # Générer mot de passe
    app_password = generer_app_password()
    
    # Enregistrer
    cur.execute("""
        INSERT INTO users (email, app_password, created_at)
        VALUES (?, ?, ?)
    """, (email, app_password, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    # Envoyer par email
    sujet = "Bienvenue - Votre mot de passe d'application"
    corps = f"""Bonjour,

Bienvenue sur notre plateforme d'envoi d'emails automatisés !

Votre compte a été créé avec succès.

📧 Email : {email}
🔑 Mot de passe d'application : {app_password}

⚠️ IMPORTANT :
- Conservez ce mot de passe en lieu sûr
- Ne le partagez avec personne
- Utilisez-le pour vous connecter à l'application

Pour vous connecter :
1. Lancez l'application
2. Entrez votre email
3. Entrez ce mot de passe

Cordialement,
L'équipe"""
    
    try:
        ok, msg = envoyer_mail_gmail(admin_email, admin_app_password, email, sujet, corps, [])
        if ok:
            return True, "Inscription réussie ! Vérifiez votre email."
        else:
            return False, f"Erreur envoi email : {msg}"
    except Exception as e:
        return False, f"Erreur : {e}"

def verifier_utilisateur(email, app_password):
    """Vérifie les identifiants d'un utilisateur"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT app_password FROM users WHERE email=?", (email,))
    result = cur.fetchone()
    conn.close()
    
    if result and result[0] == app_password:
        # Mettre à jour last_login
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("UPDATE users SET last_login=? WHERE email=?", 
                   (datetime.now().isoformat(), email))
        conn.commit()
        conn.close()
        return True
    return False
