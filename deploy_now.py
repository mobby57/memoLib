#!/usr/bin/env python3
"""
DEPLOIEMENT IMMEDIAT - IA POSTE MANAGER
Execution automatique du deploiement gratuit
"""

import os
import subprocess
import json
import time

def run_command(cmd, description):
    """Execute une commande avec gestion d'erreur"""
    print(f"\n> {description}")
    print(f"$ {cmd}")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ SUCCESS")
            if result.stdout:
                print(result.stdout)
        else:
            print("✗ ERROR")
            print(result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"✗ EXCEPTION: {e}")
        return False

def deploy_now():
    """Deploiement immediat automatise"""
    print("DEPLOIEMENT IMMEDIAT IA POSTE MANAGER")
    print("=" * 50)
    
    # 1. Verifier Git
    if not run_command("git --version", "Verification Git"):
        print("❌ Git requis. Installer depuis https://git-scm.com")
        return
    
    # 2. Initialiser repo si necessaire
    if not os.path.exists('.git'):
        run_command("git init", "Initialisation Git")
        run_command("git add .", "Ajout fichiers")
        run_command('git commit -m "Initial commit - IA Poste Manager"', "Commit initial")
    
    # 3. Installer Railway CLI
    print("\n📦 Installation Railway CLI...")
    railway_install = [
        "npm install -g @railway/cli",
        "curl -fsSL https://railway.app/install.sh | sh"  # Alternative
    ]
    
    for cmd in railway_install:
        if run_command(cmd, f"Installation Railway: {cmd}"):
            break
    
    # 4. Login Railway
    print("\n🔐 Connexion Railway...")
    print("IMPORTANT: Une page web va s'ouvrir pour l'authentification")
    time.sleep(2)
    
    if run_command("railway login", "Login Railway"):
        print("✓ Connecte a Railway")
    else:
        print("❌ Echec connexion Railway")
        print("Solution: Aller sur https://railway.app et creer un compte")
        return
    
    # 5. Creer projet Railway
    print("\n🚂 Creation projet Railway...")
    if run_command("railway init", "Initialisation projet Railway"):
        print("✓ Projet Railway cree")
    
    # 6. Deployer
    print("\n🚀 Deploiement en cours...")
    if run_command("railway up", "Deploiement Railway"):
        print("✓ Application deployee!")
        
        # Obtenir URL
        result = subprocess.run("railway status", shell=True, capture_output=True, text=True)
        if "https://" in result.stdout:
            url = [line for line in result.stdout.split('\n') if 'https://' in line][0].strip()
            print(f"\n🌐 APPLICATION LIVE: {url}")
        else:
            print("\n🌐 APPLICATION DEPLOYEE - Verifier Railway dashboard pour URL")
    
    # 7. Configuration variables
    print("\n⚙️ Configuration variables d'environnement...")
    env_vars = {
        "FLASK_ENV": "production",
        "SECRET_KEY": "your-secret-key-change-this"
    }
    
    for key, value in env_vars.items():
        run_command(f'railway variables set {key}="{value}"', f"Variable {key}")
    
    print("\n" + "=" * 50)
    print("DEPLOIEMENT TERMINE!")
    print("\nPROCHAINES ETAPES:")
    print("1. Aller sur railway.app dashboard")
    print("2. Configurer variables manquantes:")
    print("   - SUPABASE_DB_URL")
    print("   - REDIS_URL") 
    print("   - SMTP_USER/SMTP_PASSWORD")
    print("3. Tester l'application")
    print("\nCOUT: 0 euros (tier gratuit Railway)")

if __name__ == "__main__":
    deploy_now()