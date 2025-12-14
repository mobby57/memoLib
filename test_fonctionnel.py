#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test fonctionnel - Lance l'application et teste les endpoints
"""

import os
import sys
import time
import requests
import subprocess
import threading
from urllib.parse import urljoin

class TestFonctionnel:
    def __init__(self):
        self.base_url = "http://127.0.0.1:5000"
        self.app_process = None
        
    def demarrer_app(self):
        """Démarre l'application Flask en arrière-plan"""
        print("Démarrage de l'application...")
        
        try:
            # Changer vers le répertoire src/web
            os.chdir("src/web")
            
            # Lancer l'app
            self.app_process = subprocess.Popen(
                [sys.executable, "app.py"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Attendre que l'app démarre
            time.sleep(3)
            
            # Vérifier si l'app est démarrée
            if self.app_process.poll() is None:
                print("OK: Application démarrée")
                return True
            else:
                print("ERREUR: L'application n'a pas pu démarrer")
                return False
                
        except Exception as e:
            print(f"ERREUR démarrage: {e}")
            return False
    
    def arreter_app(self):
        """Arrête l'application"""
        if self.app_process:
            self.app_process.terminate()
            self.app_process.wait()
            print("Application arrêtée")
    
    def test_page_accueil(self):
        """Test de la page d'accueil"""
        print("Test page d'accueil...")
        
        try:
            response = requests.get(self.base_url, timeout=5)
            if response.status_code == 200:
                print("OK: Page d'accueil accessible")
                return True
            else:
                print(f"ERREUR: Status {response.status_code}")
                return False
        except Exception as e:
            print(f"ERREUR: {e}")
            return False
    
    def test_page_config(self):
        """Test de la page de configuration"""
        print("Test page configuration...")
        
        try:
            url = urljoin(self.base_url, "/config")
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print("OK: Page configuration accessible")
                return True
            else:
                print(f"ERREUR: Status {response.status_code}")
                return False
        except Exception as e:
            print(f"ERREUR: {e}")
            return False
    
    def test_api_status(self):
        """Test de l'API status"""
        print("Test API status...")
        
        try:
            url = urljoin(self.base_url, "/api/status")
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    print("OK: API status fonctionne")
                    return True
                else:
                    print("ERREUR: Status API incorrect")
                    return False
            else:
                print(f"ERREUR: Status {response.status_code}")
                return False
        except Exception as e:
            print(f"ERREUR: {e}")
            return False
    
    def test_pages_statiques(self):
        """Test des ressources statiques"""
        print("Test ressources statiques...")
        
        try:
            # Test CSS
            url = urljoin(self.base_url, "/static/style.css")
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print("OK: CSS accessible")
                return True
            else:
                print(f"ERREUR CSS: Status {response.status_code}")
                return False
        except Exception as e:
            print(f"ERREUR: {e}")
            return False
    
    def run_tests(self):
        """Exécute tous les tests fonctionnels"""
        print("=" * 50)
        print("TESTS FONCTIONNELS SECUREVAULT")
        print("=" * 50)
        
        # Démarrer l'application
        if not self.demarrer_app():
            return False
        
        try:
            tests = [
                self.test_page_accueil,
                self.test_page_config,
                self.test_api_status,
                self.test_pages_statiques
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
                print("SUCCÈS: Application fonctionnelle!")
                print(f"Accédez à: {self.base_url}")
                return True
            else:
                print(f"ÉCHEC: {total - passed} test(s) échoué(s)")
                return False
                
        finally:
            self.arreter_app()

def main():
    """Point d'entrée principal"""
    # Vérifier qu'on est dans le bon répertoire
    if not os.path.exists("src/web/app.py"):
        print("ERREUR: Exécutez ce script depuis le répertoire racine du projet")
        return False
    
    # Vérifier que requests est disponible
    try:
        import requests
    except ImportError:
        print("ERREUR: Module 'requests' requis")
        print("Installez avec: pip install requests")
        return False
    
    # Lancer les tests
    tester = TestFonctionnel()
    return tester.run_tests()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)