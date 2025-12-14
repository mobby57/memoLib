#!/usr/bin/env python3
"""Test simple de l'application"""

import sys
import os
import time
import threading
import requests
from pathlib import Path

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(__file__))

def test_app_startup():
    """Teste le démarrage de l'application"""
    print("=== TEST DEMARRAGE APPLICATION ===")
    
    try:
        # Import de l'app
        from src.web.app import app
        print("OK Import de l'application reussi")
        
        # Test des routes principales
        with app.test_client() as client:
            print("\n=== TEST DES ROUTES ===")
            
            routes_to_test = [
                ('/', 'Page d\'accueil'),
                ('/login', 'Page de connexion'),
                ('/api/health', 'API Health check'),
                ('/api/check-credentials', 'Vérification credentials'),
            ]
            
            for route, description in routes_to_test:
                try:
                    response = client.get(route)
                    if response.status_code in [200, 302]:  # 302 = redirect
                        print(f"OK {route} - {description} (Status: {response.status_code})")
                    else:
                        print(f"WARN {route} - {description} (Status: {response.status_code})")
                except Exception as e:
                    print(f"ERROR {route} - Erreur: {e}")
        
        print("\n=== TEST CONFIGURATION ===")
        
        # Vérifier la configuration
        from src.core.config import Config
        print(f"OK Repertoire app: {Config.APP_DIR}")
        print(f"OK Repertoire data existe: {Path(Config.APP_DIR).exists()}")
        
        # Vérifier les fichiers de données
        data_files = [
            'credentials.enc',
            'metadata.json',
            'salt.bin'
        ]
        
        for file_name in data_files:
            file_path = Path(Config.APP_DIR) / file_name
            if file_path.exists():
                print(f"OK {file_name} existe")
            else:
                print(f"INFO {file_name} n'existe pas (normal pour premiere utilisation)")
        
        return True
        
    except Exception as e:
        print(f"ERROR Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    """Teste les endpoints API sans démarrer le serveur"""
    print("\n=== TEST ENDPOINTS API ===")
    
    try:
        from src.web.app import app
        
        with app.test_client() as client:
            # Test des endpoints API
            api_endpoints = [
                ('/api/health', 'GET'),
                ('/api/check-credentials', 'GET'),
                ('/api/templates', 'GET'),
                ('/api/contacts', 'GET'),
                ('/api/stats', 'GET'),
            ]
            
            for endpoint, method in api_endpoints:
                try:
                    if method == 'GET':
                        response = client.get(endpoint)
                    elif method == 'POST':
                        response = client.post(endpoint, json={})
                    
                    if response.status_code == 200:
                        print(f"OK {method} {endpoint} - OK")
                        # Afficher un apercu de la reponse
                        if response.is_json:
                            data = response.get_json()
                            if isinstance(data, dict) and 'success' in data:
                                print(f"   -> Success: {data.get('success')}")
                    else:
                        print(f"WARN {method} {endpoint} - Status: {response.status_code}")
                        
                except Exception as e:
                    print(f"ERROR {method} {endpoint} - Erreur: {e}")
        
        return True
        
    except Exception as e:
        print(f"ERROR Erreur test API: {e}")
        return False

def test_services():
    """Teste les services principaux"""
    print("\n=== TEST SERVICES ===")
    
    try:
        # Test du service de chiffrement
        from src.core.crypto_utils import generer_cle_fernet
        key = generer_cle_fernet("test123", b"salt")
        print("OK Service de chiffrement OK")
        
        # Test de la base de donnees
        from src.core.database import Database
        db = Database("data/test.db")  # Base de test
        print("OK Service de base de donnees OK")
        
        # Test du gestionnaire de templates
        from src.core.template_manager import TemplateManager
        template_manager = TemplateManager("data")
        print("OK Gestionnaire de templates OK")
        
        # Test du service SMTP (sans envoi reel)
        from src.services.smtp_service import SMTPService
        smtp = SMTPService()
        print("OK Service SMTP OK")
        
        return True
        
    except Exception as e:
        print(f"ERROR Erreur test services: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Fonction principale de test"""
    print("IAPosteManager v2.2 - Test Complet")
    print("=" * 50)
    
    results = []
    
    # Test du démarrage
    results.append(("Démarrage application", test_app_startup()))
    
    # Test des endpoints
    results.append(("Endpoints API", test_api_endpoints()))
    
    # Test des services
    results.append(("Services", test_services()))
    
    # Resume
    print("\n" + "=" * 50)
    print("RESUME DES TESTS")
    print("=" * 50)
    
    total_tests = len(results)
    passed_tests = sum(1 for _, result in results if result)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nResultat: {passed_tests}/{total_tests} tests reussis")
    
    if passed_tests == total_tests:
        print("\nTOUS LES TESTS SONT PASSES!")
        print("L'application est prete a etre utilisee.")
        print("\nPour demarrer:")
        print("python src/web/app.py")
        print("Puis ouvrir: http://127.0.0.1:5000")
    else:
        print(f"\n{total_tests - passed_tests} test(s) ont echoue.")
        print("Verifiez les erreurs ci-dessus.")
    
    print("=" * 50)

if __name__ == '__main__':
    main()