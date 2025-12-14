#!/usr/bin/env python3
"""
Lanceur pour SecureVault Accessible
Interface universelle pour illettrés, sourds, muets, aveugles
"""

import sys
import os
import subprocess
import webbrowser
import time
from pathlib import Path

def check_dependencies():
    """Vérifier les dépendances nécessaires"""
    required_packages = [
        'flask',
        'pyttsx3', 
        'speechrecognition',
        'pyaudio'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing.append(package)
    
    if missing:
        print("Installation des dependances manquantes...")
        for package in missing:
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                print(f"OK {package} installe")
            except subprocess.CalledProcessError:
                print(f"Erreur installation {package}")
                return False
    
    return True

def setup_directories():
    """Créer les dossiers nécessaires"""
    directories = [
        'data',
        'uploads',
        'logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"Dossier {directory} pret")

def start_accessible_app():
    """Démarrer l'application accessible"""
    print("Demarrage de SecureVault Accessible...")
    print("=" * 50)
    print("INTERFACE UNIVERSELLE")
    print("Pour illettres, sourds, muets, aveugles")
    print("Navigation vocale integree")
    print("3 boutons maximum")
    print("=" * 50)
    
    # Vérifications
    if not check_dependencies():
        print("❌ Erreur lors de l'installation des dépendances")
        return False
    
    setup_directories()
    
    # Démarrer l'application
    try:
        # Importer et lancer l'app accessible
        sys.path.insert(0, 'src/accessibility')
        from accessible_app import app
        
        print("\nApplication accessible demarree !")
        print("URL: http://127.0.0.1:5001")
        print("Interface vocale activee")
        print("Raccourcis clavier:")
        print("   - 1: Creer message")
        print("   - 2: Joindre fichier") 
        print("   - 3: Envoyer")
        print("   - H: Aide")
        print("   - Ctrl+Espace: Commande vocale")
        print("\nL'application va parler automatiquement")
        print("=" * 50)
        
        # Ouvrir le navigateur automatiquement
        time.sleep(2)
        webbrowser.open('http://127.0.0.1:5001')
        
        # Lancer l'application
        app.run(
            debug=False,
            host='0.0.0.0',
            port=5001,
            use_reloader=False
        )
        
    except KeyboardInterrupt:
        print("\nApplication fermee par l'utilisateur")
        return True
    except Exception as e:
        print(f"Erreur: {e}")
        return False

def show_help():
    """Afficher l'aide"""
    print("""
🎯 SecureVault Accessible - Aide

UTILISATION:
  python run_accessible.py        Démarrer l'application
  python run_accessible.py --help Afficher cette aide

FONCTIONNALITÉS:
  📝 Création de messages par la voix
  🎤 Navigation entièrement vocale  
  📎 Ajout de fichiers simplifié
  📤 Envoi automatique d'emails
  🔊 Synthèse vocale intégrée
  ⌨️  Navigation clavier accessible

CIBLES:
  👥 Personnes illettrées
  🦻 Personnes sourdes
  🤐 Personnes muettes  
  👁️ Personnes aveugles
  ♿ Accessibilité universelle

NAVIGATION:
  - Interface 3 boutons maximum
  - Commandes vocales naturelles
  - Raccourcis clavier simples
  - Compatible lecteurs d'écran
  - Mode sombre automatique

SUPPORT:
  🌐 http://127.0.0.1:5001
  📧 Configuration automatique email
  🔐 Sécurité intégrée
  """)

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h']:
        show_help()
    else:
        start_accessible_app()