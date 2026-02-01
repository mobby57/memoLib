#!/usr/bin/env python3
"""
Script pour mettre à jour .env avec les vraies valeurs
"""
import secrets

def update_env_with_real_values():
    """Mettre à jour .env avec des valeurs réelles"""
    
    print("🔧 Mise à jour du fichier .env avec des valeurs réelles")
    
    # Lire le fichier actuel
    with open('.env', 'r') as f:
        content = f.read()
    
    # Générer SECRET_KEY si nécessaire
    if 'SECRET_KEY=your_secret_key_here' in content:
        secret_key = secrets.token_urlsafe(32)
        content = content.replace('SECRET_KEY=your_secret_key_here', f'SECRET_KEY={secret_key}')
        print("✅ SECRET_KEY générée automatiquement")
    
    # Demander les valeurs manquantes
    print("\n📋 Entrez vos vraies valeurs (ou Entrée pour garder l'actuel):")
    
    # Redis Password
    if 'REDIS_PASSWORD=your_redis_password_here' in content:
        redis_pass = input("🔑 Redis Password: ").strip()
        if redis_pass:
            content = content.replace('REDIS_PASSWORD=your_redis_password_here', f'REDIS_PASSWORD={redis_pass}')
            print("✅ REDIS_PASSWORD mis à jour")
    
    # Ajouter d'autres variables importantes
    additional_vars = """
# Variables supplémentaires ajoutées automatiquement
PORT=5000
TIMEZONE=Europe/Paris
SQLITE_PATH=./data/iaposte.db
"""
    
    if 'PORT=' not in content:
        content += additional_vars
    
    # Sauvegarder
    with open('.env', 'w') as f:
        f.write(content)
    
    print("\n✅ Fichier .env mis à jour!")
    print("🚀 Vous pouvez maintenant lancer: python app.py")

if __name__ == "__main__":
    update_env_with_real_values()