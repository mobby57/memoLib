#!/usr/bin/env python3
"""
Quick Server Test - Vérifie si le serveur fonctionne
"""
import requests
import sys
import time

def test_server(max_retries=5):
    """Test le serveur avec retry"""
    base_url = "http://localhost:5000"
    
    print("\n🔍 Test du serveur API...")
    print(f"URL: {base_url}\n")
    
    for i in range(max_retries):
        try:
            # Test health endpoint
            print(f"Tentative {i+1}/{max_retries}... ", end="")
            response = requests.get(f"{base_url}/api/v2/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print("✅ SUCCÈS")
                print(f"\nRésultat:")
                print(f"  Status: {data.get('status')}")
                print(f"  Database: {data.get('database')}")
                print(f"  Timestamp: {data.get('timestamp')}")
                return True
            else:
                print(f"❌ Erreur HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connexion refusée")
        except requests.exceptions.Timeout:
            print("❌ Timeout")
        except Exception as e:
            print(f"❌ Erreur: {e}")
        
        if i < max_retries - 1:
            time.sleep(2)
    
    print("\n❌ Le serveur ne répond pas après {} tentatives".format(max_retries))
    return False

if __name__ == '__main__':
    success = test_server()
    sys.exit(0 if success else 1)
