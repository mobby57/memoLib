#!/usr/bin/env python3
"""Déploiement Render - Alternative simple"""

def deploy_render():
    print("=== RENDER DEPLOYMENT ===")
    
    # Créer gunicorn config
    with open("gunicorn.conf.py", "w") as f:
        f.write("""bind = "0.0.0.0:10000"
workers = 1
timeout = 120""")
    
    # Créer start command
    with open("start.sh", "w") as f:
        f.write("gunicorn --config gunicorn.conf.py app:app")
    
    print("✅ Fichiers créés")
    print("🚀 Aller sur: https://render.com")
    print("📋 Actions:")
    print("1. New Web Service")
    print("2. Connect GitHub repo")
    print("3. Build: pip install -r requirements.txt")
    print("4. Start: ./start.sh")
    print("5. Variables: SECRET_KEY")
    print("6. Deploy automatique")

if __name__ == "__main__":
    deploy_render()