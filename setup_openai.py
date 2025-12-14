#!/usr/bin/env python3
"""Configuration rapide OpenAI pour SecureVault"""
import sys
import os
sys.path.insert(0, '.')

from src.core.crypto_utils import sauvegarder_api_key
from src.core.config import Config

def setup_openai():
    print("=" * 50)
    print("Configuration OpenAI - SecureVault")
    print("=" * 50)
    
    print("\n1. Obtenez votre clé API sur: https://platform.openai.com/api-keys")
    print("2. Créez une nouvelle clé secrète")
    print("3. Copiez la clé (sk-...)")
    
    api_key = input("\nEntrez votre clé OpenAI (sk-...): ").strip()
    
    if not api_key.startswith('sk-'):
        print("❌ Clé invalide - doit commencer par 'sk-'")
        return
    
    master_password = input("Mot de passe maître: ").strip()
    
    if len(master_password) < 8:
        print("❌ Mot de passe trop court (min 8 caractères)")
        return
    
    # Sauvegarder
    success = sauvegarder_api_key(api_key, "", master_password, Config.APP_DIR)
    
    if success:
        print("✅ Clé OpenAI configurée avec succès!")
        print("\nMaintenant vous pouvez:")
        print("- Utiliser la génération IA d'emails")
        print("- Reformuler vos demandes automatiquement")
        print("- Créer des emails professionnels")
    else:
        print("❌ Erreur lors de la sauvegarde")

if __name__ == '__main__':
    setup_openai()