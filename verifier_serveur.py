# -*- coding: utf-8 -*-
import requests
import json
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("\n" + "="*60)
print("VERIFICATION DU SERVEUR")
print("="*60 + "\n")

try:
    r = requests.get("http://127.0.0.1:5000/api/health", timeout=2)
    data = r.json()
    print(f"✅ Serveur actif")
    print(f"   Version: {data.get('version', 'N/A')}")
    print(f"   Status: {data.get('status', 'N/A')}")
    
    # Test destinataires
    print("\n" + "-"*60)
    r2 = requests.get("http://127.0.0.1:5000/api/destinataires", timeout=2)
    
    if r2.status_code == 200:
        try:
            data2 = r2.json()
            print("✅ /api/destinataires → 200 OK (JSON)")
            print(f"   Success: {data2.get('success')}")
        except:
            print("❌ /api/destinataires → 200 mais pas JSON")
    else:
        print(f"❌ /api/destinataires → {r2.status_code}")
        if 'html' in r2.text.lower():
            print("   ⚠️  RETOURNE DU HTML - MAUVAIS FICHIER!")
    
    # Test workflows
    r3 = requests.get("http://127.0.0.1:5000/api/workflows", timeout=2)
    if r3.status_code == 200:
        try:
            data3 = r3.json()
            print("✅ /api/workflows → 200 OK (JSON)")
        except:
            print("❌ /api/workflows → 200 mais pas JSON")
    else:
        print(f"❌ /api/workflows → {r3.status_code}")
    
    print("\n" + "="*60)
    if r2.status_code == 200 and r3.status_code == 200:
        print("✅ SERVEUR CORRECT - src\\web\\app.py")
    else:
        print("❌ MAUVAIS SERVEUR - Relancer avec DEMARRER_ICI.bat")
    print("="*60 + "\n")
    
except requests.exceptions.ConnectionError:
    print("❌ Serveur non démarré")
    print("   Lancer: DEMARRER_ICI.bat\n")
except Exception as e:
    print(f"❌ Erreur: {e}\n")
