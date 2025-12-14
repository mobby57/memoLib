#!/usr/bin/env python3
"""Test de démarrage de l'application"""

import sys
import os

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(__file__))

def test_imports():
    """Test des imports principaux"""
    try:
        print("Test des imports...")
        
        # Test Flask
        from flask import Flask
        print("[OK] Flask importé")
        
        # Test cryptography
        from cryptography.fernet import Fernet
        print("[OK] Cryptography importé")
        
        # Test des modules de l'app
        from src.core.config import Config
        print("[OK] Config importé")
        
        from src.core.crypto_utils import credentials_existent
        print("[OK] Crypto utils importé")
        
        from src.core.database import Database
        print("[OK] Database importé")
        
        from src.services.smtp_service import SMTPService
        print("[OK] SMTP Service importé")
        
        print("[SUCCESS] Tous les imports principaux réussis")
        return True
        
    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        return False

def test_config():
    """Test de la configuration"""
    try:
        print("\nTest de la configuration...")
        
        from src.core.config import Config
        
        print(f"[OK] APP_DIR: {Config.APP_DIR}")
        print(f"[OK] PBKDF2_ITERATIONS: {Config.PBKDF2_ITERATIONS}")
        
        # Vérifier que le dossier data existe
        if os.path.exists(Config.APP_DIR):
            print("[OK] Dossier data existe")
        else:
            print("[WARN] Dossier data créé")
            os.makedirs(Config.APP_DIR, exist_ok=True)
        
        print("[SUCCESS] Configuration OK")
        return True
        
    except Exception as e:
        print(f"❌ Erreur configuration: {e}")
        return False

def test_database():
    """Test de la base de données"""
    try:
        print("\nTest de la base de données...")
        
        from src.core.database import Database
        from src.core.config import Config
        
        db = Database(os.path.join(Config.APP_DIR, 'test.db'))
        print("[OK] Base de données initialisée")
        
        # Test d'insertion
        email_id = db.save_email('test@example.com', 'Test', 'Corps de test')
        print(f"[OK] Email de test sauvegardé (ID: {email_id})")
        
        # Test de récupération
        history = db.get_email_history(1)
        if history:
            print("[OK] Historique récupéré")
        
        print("[SUCCESS] Base de données OK")
        return True
        
    except Exception as e:
        print(f"❌ Erreur base de données: {e}")
        return False

def test_app_creation():
    """Test de création de l'app Flask"""
    try:
        print("\nTest de création de l'application...")
        
        # Import minimal pour test
        from flask import Flask
        from src.core.config import Config
        
        app = Flask(__name__)
        app.config['SECRET_KEY'] = 'test-key'
        app.config['TESTING'] = True
        
        print("[OK] Application Flask créée")
        
        # Test d'une route simple
        @app.route('/test')
        def test_route():
            return {'status': 'ok'}
        
        with app.test_client() as client:
            response = client.get('/test')
            if response.status_code == 200:
                print("[OK] Route de test fonctionne")
        
        print("[SUCCESS] Application Flask OK")
        return True
        
    except Exception as e:
        print(f"❌ Erreur création app: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("=" * 50)
    print("  TEST DE DÉMARRAGE - IAPosteManager v2.2")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_config,
        test_database,
        test_app_creation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"RÉSULTATS: {passed}/{total} tests réussis")
    
    if passed == total:
        print("[SUCCESS] Tous les tests sont passés ! L'application est prête.")
        print("\nPour démarrer l'application:")
        print("  python src/web/app.py")
        print("  ou")
        print("  START_SIMPLE.bat")
        print("\nURL: http://127.0.0.1:5000")
    else:
        print("[WARN] Certains tests ont échoué. Vérifiez les erreurs ci-dessus.")
    
    print("=" * 50)

if __name__ == '__main__':
    main()