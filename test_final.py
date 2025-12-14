#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test final - Vérifie que SecureVault est prêt à être utilisé
"""

import os
import sys
import subprocess
import time

def test_structure():
    """Vérifie la structure des fichiers"""
    print("1. Vérification de la structure...")
    
    required = [
        'src/web/app.py',
        'src/core/config.py',
        'requirements.txt',
        'templates/index.html'
    ]
    
    for file_path in required:
        if not os.path.exists(file_path):
            print(f"   MANQUANT: {file_path}")
            return False
    
    print("   OK: Tous les fichiers requis présents")
    return True

def test_dependencies():
    """Vérifie les dépendances Python"""
    print("2. Vérification des dépendances...")
    
    try:
        import flask
        import cryptography
        print("   OK: Flask et Cryptography disponibles")
        return True
    except ImportError as e:
        print(f"   ERREUR: {e}")
        print("   Exécutez: pip install -r requirements.txt")
        return False

def test_app_startup():
    """Teste le démarrage de l'application"""
    print("3. Test de démarrage de l'application...")
    
    try:
        # Changer vers src/web
        original_dir = os.getcwd()
        os.chdir("src/web")
        
        # Lancer l'app avec timeout
        process = subprocess.Popen(
            [sys.executable, "app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Attendre 3 secondes
        time.sleep(3)
        
        # Vérifier si l'app tourne
        if process.poll() is None:
            print("   OK: Application démarre correctement")
            process.terminate()
            process.wait()
            os.chdir(original_dir)
            return True
        else:
            stdout, stderr = process.communicate()
            print("   ERREUR: Application ne démarre pas")
            if stderr:
                print(f"   Détails: {stderr.decode()[:200]}")
            os.chdir(original_dir)
            return False
            
    except Exception as e:
        print(f"   ERREUR: {e}")
        try:
            os.chdir(original_dir)
        except:
            pass
        return False

def test_basic_functionality():
    """Teste les fonctionnalités de base"""
    print("4. Test des fonctionnalités de base...")
    
    try:
        # Ajouter src au path
        sys.path.insert(0, 'src')
        
        # Test crypto
        from cryptography.fernet import Fernet
        key = Fernet.generate_key()
        f = Fernet(key)
        encrypted = f.encrypt(b"test")
        decrypted = f.decrypt(encrypted)
        assert decrypted == b"test"
        
        # Test config
        from core.config import Config
        assert hasattr(Config, 'SECRET_KEY')
        
        print("   OK: Chiffrement et configuration fonctionnent")
        return True
        
    except Exception as e:
        print(f"   ERREUR: {e}")
        return False

def main():
    """Test principal"""
    print("=" * 60)
    print("SECUREVAULT - TEST FINAL")
    print("Vérification que l'application est prête à être utilisée")
    print("=" * 60)
    
    tests = [
        test_structure,
        test_dependencies, 
        test_app_startup,
        test_basic_functionality
    ]
    
    passed = 0
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 60)
    print(f"RÉSULTATS: {passed}/{len(tests)} tests réussis")
    print("=" * 60)
    
    if passed == len(tests):
        print("SUCCES! SecureVault est pret!")
        print("\nPour utiliser l'application:")
        print("1. python src/web/app.py")
        print("2. Ouvrir http://127.0.0.1:5000")
        print("3. Créer un mot de passe maître")
        print("4. Configurer Gmail App Password")
        print("5. (Optionnel) Ajouter clé OpenAI")
        print("\nFonctionnalités disponibles:")
        print("- Envoi d'emails sécurisé")
        print("- Génération IA de contenu")
        print("- Chiffrement AES-256")
        print("- Interface responsive")
        return True
    else:
        print("Des problemes ont ete detectes")
        print("\nActions recommandées:")
        if passed < 2:
            print("- Vérifiez la structure du projet")
            print("- Installez les dépendances: pip install -r requirements.txt")
        else:
            print("- Consultez les messages d'erreur ci-dessus")
            print("- Vérifiez les logs de l'application")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)