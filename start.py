#!/usr/bin/env python3
"""
SecureVault - Démarrage rapide
"""
import os
import sys
import subprocess

def main():
    print("=" * 50)
    print("SecureVault v2.2 - Démarrage")
    print("=" * 50)
    
    # Vérifier si on est dans le bon répertoire
    if not os.path.exists('src/web/app.py'):
        print("ERREUR: Lancez ce script depuis le répertoire racine du projet")
        return
    
    print("Démarrage de l'application...")
    print("URL: http://127.0.0.1:5000")
    print("Appuyez sur Ctrl+C pour arrêter")
    print("=" * 50)
    
    try:
        # Lancer l'application
        subprocess.run([sys.executable, 'src/web/app.py'])
    except KeyboardInterrupt:
        print("\nApplication arrêtée")

if __name__ == '__main__':
    main()