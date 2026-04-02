#!/usr/bin/env python3
"""
Script de démarrage rapide - IA Poste Manager v3.1
Configuration automatique du projet
"""
import os
import secrets
import shutil
from pathlib import Path

def generate_secret_key():
    """Générer une clé secrète sécurisée"""
    return secrets.token_urlsafe(32)

def setup_project():
    """Configuration initiale du projet"""
    
    print("🚀 IA Poste Manager v3.1 - Configuration rapide")
    print("=" * 50)
    
    # 1. Vérifier si .env existe
    env_file = Path(".env")
    if not env_file.exists():
        print("📋 Création du fichier .env...")
        shutil.copy(".env.example", ".env")
        print("✅ Fichier .env créé depuis .env.example")
    
    # 2. Générer SECRET_KEY si manquant
    with open(".env", "r") as f:
        content = f.read()
    
    if "SECRET_KEY=your_secret_key_here" in content:
        secret_key = generate_secret_key()
        content = content.replace(
            "SECRET_KEY=your_secret_key_here_minimum_32_chars",
            f"SECRET_KEY={secret_key}"
        )
        
        with open(".env", "w") as f:
            f.write(content)
        
        print("🔑 SECRET_KEY générée automatiquement")
    
    # 3. Configuration minimale interactive
    print("\n🔧 Configuration minimale requise:")
    
    redis_host = input("Redis Host (ou Entrée pour garder l'exemple): ").strip()
    if redis_host:
        content = content.replace(
            "REDIS_HOST=redis-xxxxx.c267.us-east-1-4.ec2.cloud.redislabs.com",
            f"REDIS_HOST={redis_host}"
        )
    
    redis_password = input("Redis Password (ou Entrée pour passer): ").strip()
    if redis_password:
        content = content.replace(
            "REDIS_PASSWORD=your_redis_password_here",
            f"REDIS_PASSWORD={redis_password}"
        )
        
        with open(".env", "w") as f:
            f.write(content)
    
    # 4. Créer dossiers nécessaires
    dirs_to_create = [
        "data/uploads",
        "data/ceseda", 
        "logs",
        "src/frontend/components",
        "src/frontend/pages",
        "src/frontend/styles"
    ]
    
    for dir_path in dirs_to_create:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    print("📁 Dossiers créés")
    
    # 5. Vérifier la configuration
    print("\n🔍 Vérification finale...")
    os.system("python check_env.py")
    
    print("\n✅ Configuration terminée!")
    print("\n📋 Prochaines étapes:")
    print("1. Éditez .env avec vos vraies valeurs Redis")
    print("2. Lancez: python app.py")
    print("3. Ouvrez: http://localhost:5000")

if __name__ == "__main__":
    setup_project()