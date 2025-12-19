#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gestionnaire de serveur SMTP personnalisé avec App Passwords par utilisateur
"""
import sqlite3, secrets, string, hashlib
from datetime import datetime

DB_PATH = "smtp_users.db"

def init_smtp_db():
    """Initialise la base de données du serveur SMTP"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS smtp_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            app_password_hash TEXT NOT NULL,
            app_password_plain TEXT NOT NULL,
            smtp_username TEXT NOT NULL,
            created_at TEXT,
            last_used TEXT,
            active INTEGER DEFAULT 1
        )
    """)
    conn.commit()
    conn.close()

def generer_app_password_utilisateur():
    """Génère un App Password unique pour un utilisateur"""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(16))

def hash_password(password):
    """Hash le mot de passe pour stockage sécurisé"""
    return hashlib.sha256(password.encode()).hexdigest()

def creer_utilisateur_smtp(email):
    """Crée un utilisateur SMTP avec son App Password"""
    init_smtp_db()
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Vérifier si existe
    cur.execute("SELECT email FROM smtp_users WHERE email=?", (email,))
    if cur.fetchone():
        conn.close()
        return None, "Utilisateur déjà existant"
    
    # Générer credentials
    app_password = generer_app_password_utilisateur()
    app_password_hash = hash_password(app_password)
    smtp_username = email.split('@')[0] + '_' + secrets.token_hex(4)
    
    # Enregistrer
    cur.execute("""
        INSERT INTO smtp_users (email, app_password_hash, app_password_plain, smtp_username, created_at, active)
        VALUES (?, ?, ?, ?, ?, 1)
    """, (email, app_password_hash, app_password, smtp_username, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    return {
        'email': email,
        'app_password': app_password,
        'smtp_username': smtp_username,
        'smtp_server': 'localhost',
        'smtp_port': 587
    }, None

def verifier_utilisateur_smtp(email, app_password):
    """Vérifie les credentials d'un utilisateur SMTP"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT app_password_hash, active FROM smtp_users WHERE email=?", (email,))
    result = cur.fetchone()
    
    if not result:
        conn.close()
        return False
    
    stored_hash, active = result
    if not active:
        conn.close()
        return False
    
    if hash_password(app_password) == stored_hash:
        # Mettre à jour last_used
        cur.execute("UPDATE smtp_users SET last_used=? WHERE email=?", 
                   (datetime.now().isoformat(), email))
        conn.commit()
        conn.close()
        return True
    
    conn.close()
    return False

def lister_utilisateurs_smtp():
    """Liste tous les utilisateurs SMTP"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, email, smtp_username, created_at, last_used, active FROM smtp_users")
    users = cur.fetchall()
    conn.close()
    return users

def desactiver_utilisateur_smtp(email):
    """Désactive un utilisateur SMTP"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE smtp_users SET active=0 WHERE email=?", (email,))
    conn.commit()
    conn.close()
