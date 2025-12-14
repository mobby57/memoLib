#!/usr/bin/env python3
"""
Script tout-en-un: Build, Test, Deploy, Verify
"""

import subprocess
import sys
import time
import requests
from pathlib import Path

def print_header(title):
    print("\n" + "=" * 50)
    print(f"  {title}")
    print("=" * 50 + "\n")

def run_command(cmd, description):
    """Exécute une commande et retourne le code de sortie"""
    print(f"🔄 {description}...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"✅ {description}: OK")
        if result.stdout:
            print(result.stdout)
        return True
    else:
        print(f"❌ {description}: ÉCHOUÉ")
        if result.stderr:
            print(result.stderr)
        return False

def test_endpoint(url, name, expected_status=[200]):
    """Teste un endpoint HTTP"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code in expected_status:
            print(f"  ✅ {name}: OK (Status {response.status_code})")
            return True
        else:
            print(f"  ❌ {name}: FAIL (Status {response.status_code})")
            return False
    except Exception as e:
        print(f"  ❌ {name}: FAIL ({str(e)})")
        return False

def main():
    print_header("IAPosteManager - Pipeline Complète v2.2")
    
    # Étape 1: Build
    print_header("ÉTAPE 1/4: Build")
    if not run_command("python build.py", "Build de l'application"):
        print("\n❌ Pipeline arrêtée: Build échoué")
        return 1
    
    # Étape 2: Vérifier si le serveur tourne déjà
    print_header("ÉTAPE 2/4: Vérification du serveur")
    server_running = False
    try:
        response = requests.get("http://127.0.0.1:5000/api/health", timeout=2)
        if response.status_code == 200:
            server_running = True
            print("✅ Serveur déjà en cours d'exécution")
    except:
        print("⚠️  Serveur non démarré, veuillez le démarrer manuellement:")
        print("   python src\\web\\app.py")
        print("\nEn attente du serveur (20 secondes)...")
        
        # Attendre jusqu'à 20 secondes
        for i in range(20):
            time.sleep(1)
            try:
                response = requests.get("http://127.0.0.1:5000/api/health", timeout=1)
                if response.status_code == 200:
                    server_running = True
                    print(f"\n✅ Serveur détecté après {i+1} secondes")
                    break
            except:
                pass
            
            if (i + 1) % 5 == 0:
                print(f"   {i+1}s écoulées...")
    
    if not server_running:
        print("\n❌ Serveur non accessible. Démarrez-le manuellement et réessayez.")
        return 1
    
    # Étape 3: Tests de production
    print_header("ÉTAPE 3/4: Tests de Production")
    
    tests = [
        ("http://127.0.0.1:5000/api/health", "Health Check", [200]),
        ("http://127.0.0.1:5000/", "Page d'accueil", [200, 302]),
        ("http://127.0.0.1:5000/api/check-credentials", "API Credentials", [200]),
        ("http://127.0.0.1:5000/static/css/style.css", "Static Files", [200, 304, 404]),
    ]
    
    passed = 0
    for url, name, expected in tests:
        if test_endpoint(url, name, expected):
            passed += 1
        time.sleep(0.5)
    
    print(f"\n📊 Résultats: {passed}/{len(tests)} tests passés")
    
    # Étape 4: Vérification finale
    print_header("ÉTAPE 4/4: Vérification Finale")
    
    if passed == len(tests):
        print("✅ SUCCÈS - Tous les tests sont passés!")
        print("\n🌐 Application disponible:")
        print("   http://127.0.0.1:5000")
        print("\n📦 Build disponible:")
        print("   dist/iapostemanager-2.2.0.zip")
        print("\n🎯 Prochaines étapes:")
        print("   1. Tester manuellement l'interface")
        print("   2. Configurer Gmail/OpenAI")
        print("   3. Envoyer un email test")
        return 0
    else:
        print(f"⚠️  AVERTISSEMENT - {len(tests) - passed} test(s) échoué(s)")
        print("\nVérifiez:")
        print("   1. Le serveur est bien démarré")
        print("   2. Les logs: logs/app.log")
        print("   3. La configuration: .env")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Pipeline interrompue par l'utilisateur")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
