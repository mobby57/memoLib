#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test simple pour vérifier que l'application fonctionne
"""

import os
import sys
import tempfile
import shutil

def test_structure_fichiers():
    """Vérifie que tous les fichiers nécessaires existent"""
    print("Test structure des fichiers...")
    
    required_files = [
        'src/web/app.py',
        'src/core/config.py', 
        'requirements.txt',
        'templates/index.html'
    ]
    
    missing = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing.append(file_path)
    
    if missing:
        print(f"ERREUR: Fichiers manquants: {missing}")
        return False
    
    print("OK: Tous les fichiers requis sont présents")
    return True

def test_imports_python():
    """Teste les imports Python de base"""
    print("Test des imports Python...")
    
    try:
        # Test imports standards
        import json
        import os
        import base64
        import secrets
        print("OK: Imports standards")
        
        # Test cryptography
        from cryptography.fernet import Fernet
        print("OK: Cryptography disponible")
        
        # Test Flask
        from flask import Flask
        print("OK: Flask disponible")
        
        return True
        
    except ImportError as e:
        print(f"ERREUR import: {e}")
        return False

def test_crypto_basique():
    """Test basique du chiffrement"""
    print("Test chiffrement basique...")
    
    try:
        from cryptography.fernet import Fernet
        
        # Générer une clé
        key = Fernet.generate_key()
        f = Fernet(key)
        
        # Chiffrer/déchiffrer
        message = "Test message"
        encrypted = f.encrypt(message.encode())
        decrypted = f.decrypt(encrypted).decode()
        
        if decrypted == message:
            print("OK: Chiffrement/déchiffrement fonctionne")
            return True
        else:
            print("ERREUR: Problème chiffrement")
            return False
            
    except Exception as e:
        print(f"ERREUR crypto: {e}")
        return False

def test_flask_basique():
    """Test basique de Flask"""
    print("Test Flask basique...")
    
    try:
        from flask import Flask
        
        app = Flask(__name__)
        
        @app.route('/')
        def home():
            return "Test OK"
        
        # Test client
        with app.test_client() as client:
            response = client.get('/')
            if response.status_code == 200:
                print("OK: Flask fonctionne")
                return True
            else:
                print("ERREUR: Flask ne répond pas")
                return False
                
    except Exception as e:
        print(f"ERREUR Flask: {e}")
        return False

def test_config():
    """Test de la configuration"""
    print("Test configuration...")
    
    try:
        # Ajouter src au path
        sys.path.insert(0, 'src')
        from core.config import Config
        
        # Vérifier quelques attributs
        if hasattr(Config, 'SECRET_KEY') and hasattr(Config, 'PBKDF2_ITERATIONS'):
            print("OK: Configuration chargée")
            return True
        else:
            print("ERREUR: Configuration incomplète")
            return False
            
    except Exception as e:
        print(f"ERREUR config: {e}")
        return False

def run_all_tests():
    """Exécute tous les tests"""
    print("=" * 50)
    print("TESTS SECUREVAULT")
    print("=" * 50)
    
    tests = [
        test_structure_fichiers,
        test_imports_python,
        test_crypto_basique,
        test_flask_basique,
        test_config
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
            print()
        except Exception as e:
            print(f"ERREUR dans {test.__name__}: {e}")
            print()
    
    print("=" * 50)
    print(f"RÉSULTATS: {passed}/{total} tests réussis")
    
    if passed == total:
        print("SUCCÈS: Tous les tests passent!")
        print("L'application devrait fonctionner correctement.")
        print("\nPour démarrer:")
        print("  python src/web/app.py")
        return True
    else:
        print(f"ÉCHEC: {total - passed} test(s) échoué(s)")
        print("Vérifiez les dépendances avec: pip install -r requirements.txt")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)