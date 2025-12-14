#!/usr/bin/env python3
import requests
import time
import sys

def test_production_deployment(base_url="http://localhost:5000"):
    tests = []
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/api/emails/health", timeout=10)
        tests.append(("Health Check", response.status_code == 200))
    except:
        tests.append(("Health Check", False))
    
    # Test 2: Page d'accueil
    try:
        response = requests.get(base_url, timeout=10)
        tests.append(("Page d'accueil", response.status_code == 200))
    except:
        tests.append(("Page d'accueil", False))
    
    # Test 3: API endpoints
    try:
        response = requests.get(f"{base_url}/api/check-credentials", timeout=10)
        tests.append(("API Credentials", response.status_code == 200))
    except:
        tests.append(("API Credentials", False))
    
    # Test 4: Static files
    try:
        response = requests.get(f"{base_url}/static/css/style.css", timeout=10)
        tests.append(("Static Files", response.status_code in [200, 404]))  # 404 OK si pas de CSS
    except:
        tests.append(("Static Files", False))
    
    # Résultats
    print("🧪 Tests de Production")
    print("=" * 30)
    
    passed = 0
    for test_name, result in tests:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nRésultat: {passed}/{len(tests)} tests passés")
    
    if passed == len(tests):
        print("🎉 Application prête pour la production!")
        return True
    else:
        print("⚠️  Problèmes détectés, vérifiez la configuration")
        return False

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    success = test_production_deployment(url)
    sys.exit(0 if success else 1)