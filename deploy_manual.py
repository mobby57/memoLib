#!/usr/bin/env python3
"""
DEPLOIEMENT IMMEDIAT - IA POSTE MANAGER
Version simplifiee sans caracteres speciaux
"""

import os
import subprocess

def run_cmd(cmd):
    """Execute commande simple"""
    print(f"Execution: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("OK")
            return True
        else:
            print(f"ERREUR: {result.stderr}")
            return False
    except Exception as e:
        print(f"EXCEPTION: {e}")
        return False

def deploy_immediate():
    """Deploiement immediat"""
    print("DEPLOIEMENT IA POSTE MANAGER")
    print("=" * 40)
    
    # Verifier Git
    print("\n1. Verification Git...")
    if not run_cmd("git --version"):
        print("Git requis - installer depuis git-scm.com")
        return
    
    # Init Git si necessaire
    if not os.path.exists('.git'):
        print("\n2. Initialisation Git...")
        run_cmd("git init")
        run_cmd("git add .")
        run_cmd('git commit -m "Deploy IA Poste Manager"')
    
    # Instructions manuelles Railway
    print("\n3. DEPLOIEMENT RAILWAY (MANUEL)")
    print("=" * 40)
    print("1. Aller sur https://railway.app")
    print("2. Creer compte gratuit")
    print("3. New Project > Deploy from GitHub repo")
    print("4. Connecter ce repository")
    print("5. Railway detecte automatiquement Python/Flask")
    print("6. Deploy automatique")
    print("\n4. VARIABLES A CONFIGURER")
    print("Dans Railway dashboard > Variables:")
    print("FLASK_ENV=production")
    print("SECRET_KEY=your-secret-key")
    print("SUPABASE_DB_URL=postgresql://...")
    print("REDIS_URL=redis://...")
    print("SMTP_USER=your-email@gmail.com")
    print("SMTP_PASSWORD=your-app-password")
    
    print("\n5. SERVICES GRATUITS A CREER")
    print("- Supabase.com (PostgreSQL 500MB)")
    print("- Upstash.com (Redis 10K req/jour)")
    print("- Sentry.io (Monitoring 5K erreurs)")
    
    print("\n" + "=" * 40)
    print("DEPLOIEMENT PREPARE!")
    print("Suivre instructions ci-dessus")
    print("Application sera live en 10 minutes")
    print("COUT: 0 euros")

if __name__ == "__main__":
    deploy_immediate()