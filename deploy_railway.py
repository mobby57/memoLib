#!/usr/bin/env python3
"""Déploiement Railway - Alternative à Vercel"""

import subprocess
import os

def deploy_railway():
    print("=== DÉPLOIEMENT RAILWAY ===")
    
    # 1. Créer Procfile
    with open("Procfile", "w") as f:
        f.write("web: python app.py")
    
    # 2. Créer runtime.txt
    with open("runtime.txt", "w") as f:
        f.write("python-3.11.0")
    
    print("✅ Fichiers Railway créés")
    print("🚀 Aller sur: https://railway.app")
    print("📋 Actions:")
    print("1. Connecter GitHub")
    print("2. Deploy from repo")
    print("3. Variables: SECRET_KEY, FLASK_ENV")
    print("4. URL automatique générée")

if __name__ == "__main__":
    deploy_railway()