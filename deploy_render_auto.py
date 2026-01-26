#!/usr/bin/env python3
"""Déploiement automatique Render"""

import webbrowser
import time

def deploy_render():
    print("=== RENDER DEPLOYMENT (100% GRATUIT) ===")
    print()
    
    print("1. Ouverture Render...")
    webbrowser.open("https://render.com")
    time.sleep(2)
    
    print("2. Ouverture GitHub repo...")
    webbrowser.open("https://github.com")
    time.sleep(2)
    
    print()
    print("ÉTAPES À SUIVRE:")
    print("1. Créer compte Render (gratuit)")
    print("2. New Web Service")
    print("3. Connect GitHub repo: iaPostemanage")
    print("4. Build Command: pip install -r requirements.txt")
    print("5. Start Command: gunicorn app:app")
    print("6. Environment Variables:")
    print("   - SECRET_KEY: RmuekVcRKUvQrDLqTQWgnNem1hWog-R6IoByxAOgk1Q")
    print("   - FLASK_ENV: production")
    print("7. Create Web Service")
    print()
    print("RÉSULTAT: URL live gratuite illimitée!")

if __name__ == "__main__":
    deploy_render()