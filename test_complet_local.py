#!/usr/bin/env python3
"""
Script de test complet pour IAPosteManager
Usage: python test_complet_local.py
"""

import requests
import time
import json
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
PAGES_TO_TEST = [
    "/",
    "/navigation.html",
    "/dashboard.html", 
    "/compose.html",
    "/ai-generator.html",
    "/voice.html",
    "/templates.html",
    "/batch.html",
    "/history.html",
    "/contacts.html",
    "/settings.html",
    "/accessibility.html"
]

API_ENDPOINTS = [
    "/api/health",
    "/api/dashboard/stats",
    "/api/email-history",
    "/api/templates",
    "/api/contacts",
    "/api/accessibility/settings",
    "/api/accessibility/transcripts",
    "/api/accessibility/keyboard-shortcuts"
]

def print_header(title):
    print("\n" + "="*60)
    print(f"🧪 {title}")
    print("="*60)

def test_server_status():
    print_header("TEST SERVEUR")
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=2)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Serveur en ligne - Status: {data.get('status', 'unknown')}")
            print(f"📊 Version: {data.get('version', 'unknown')}")
            return True
        else:
            print(f"❌ Serveur répond avec code {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Serveur inaccessible: {e}")
        return False

def test_pages():
    print_header("TEST PAGES HTML")
    results = []
    
    for page in PAGES_TO_TEST:
        try:
            response = requests.get(f"{BASE_URL}{page}", timeout=3)
            if response.status_code == 200:
                print(f"✅ {page} - OK")
                results.append((page, True, response.status_code))
            else:
                print(f"❌ {page} - Code {response.status_code}")
                results.append((page, False, response.status_code))
        except requests.exceptions.RequestException as e:
            print(f"❌ {page} - Erreur: {e}")
            results.append((page, False, "Erreur"))
        
        time.sleep(0.2)  # Éviter de surcharger le serveur
    
    return results

def test_api_endpoints():
    print_header("TEST API ENDPOINTS")
    results = []
    
    for endpoint in API_ENDPOINTS:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=3)
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"✅ {endpoint} - JSON valide")
                    results.append((endpoint, True, "JSON OK"))
                except json.JSONDecodeError:
                    print(f"⚠️ {endpoint} - Réponse non-JSON")
                    results.append((endpoint, True, "Non-JSON"))
            else:
                print(f"❌ {endpoint} - Code {response.status_code}")
                results.append((endpoint, False, response.status_code))
        except requests.exceptions.RequestException as e:
            print(f"❌ {endpoint} - Erreur: {e}")
            results.append((endpoint, False, "Erreur"))
        
        time.sleep(0.2)
    
    return results

def test_email_functionality():
    print_header("TEST FONCTIONNALITÉS EMAIL")
    
    # Test génération email IA
    try:
        payload = {
            "context": "Test de génération automatique",
            "tone": "professionnel"
        }
        response = requests.post(f"{BASE_URL}/api/generate-email", 
                               json=payload, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Génération IA - OK")
                print(f"   Sujet: {data.get('subject', 'N/A')[:50]}...")
            else:
                print(f"❌ Génération IA - Erreur: {data.get('error', 'Inconnue')}")
        else:
            print(f"❌ Génération IA - Code {response.status_code}")
    except Exception as e:
        print(f"❌ Génération IA - Exception: {e}")
    
    # Test envoi email (simulation)
    try:
        payload = {
            "recipient": "test@example.com",
            "subject": "Test automatique",
            "body": "Ceci est un test automatique du système."
        }
        response = requests.post(f"{BASE_URL}/api/send-email", 
                               json=payload, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Envoi email - OK (simulé)")
            else:
                print(f"⚠️ Envoi email - {data.get('message', 'Erreur')}")
        else:
            print(f"❌ Envoi email - Code {response.status_code}")
    except Exception as e:
        print(f"❌ Envoi email - Exception: {e}")

def test_accessibility():
    print_header("TEST ACCESSIBILITÉ")
    
    # Test paramètres accessibilité
    try:
        response = requests.get(f"{BASE_URL}/api/accessibility/settings", timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Paramètres accessibilité - OK")
                settings = data.get('settings', {})
                print(f"   TTS: {'Activé' if settings.get('tts_enabled') else 'Désactivé'}")
                print(f"   Contraste: {'Activé' if settings.get('high_contrast') else 'Désactivé'}")
            else:
                print("❌ Paramètres accessibilité - Erreur dans la réponse")
        else:
            print(f"❌ Paramètres accessibilité - Code {response.status_code}")
    except Exception as e:
        print(f"❌ Paramètres accessibilité - Exception: {e}")
    
    # Test TTS
    try:
        payload = {
            "text": "Test de synthèse vocale automatique",
            "priority": "normal"
        }
        response = requests.post(f"{BASE_URL}/api/accessibility/speak", 
                               json=payload, timeout=3)
        if response.status_code == 200:
            print("✅ Synthèse vocale - OK")
        else:
            print(f"❌ Synthèse vocale - Code {response.status_code}")
    except Exception as e:
        print(f"❌ Synthèse vocale - Exception: {e}")

def test_database():
    print_header("TEST BASE DE DONNÉES")
    
    # Test historique emails
    try:
        response = requests.get(f"{BASE_URL}/api/email-history?limit=5", timeout=3)
        if response.status_code == 200:
            data = response.json()
            emails = data.get('emails', [])
            print(f"✅ Historique emails - {len(emails)} emails trouvés")
        else:
            print(f"❌ Historique emails - Code {response.status_code}")
    except Exception as e:
        print(f"❌ Historique emails - Exception: {e}")
    
    # Test contacts
    try:
        response = requests.get(f"{BASE_URL}/api/contacts", timeout=3)
        if response.status_code == 200:
            data = response.json()
            contacts = data.get('contacts', [])
            print(f"✅ Contacts - {len(contacts)} contacts trouvés")
        else:
            print(f"❌ Contacts - Code {response.status_code}")
    except Exception as e:
        print(f"❌ Contacts - Exception: {e}")

def generate_report(page_results, api_results):
    print_header("RAPPORT DE TEST")
    
    # Statistiques pages
    pages_ok = sum(1 for _, success, _ in page_results if success)
    pages_total = len(page_results)
    print(f"📄 Pages HTML: {pages_ok}/{pages_total} OK ({pages_ok/pages_total*100:.1f}%)")
    
    # Statistiques API
    api_ok = sum(1 for _, success, _ in api_results if success)
    api_total = len(api_results)
    print(f"🔌 API Endpoints: {api_ok}/{api_total} OK ({api_ok/api_total*100:.1f}%)")
    
    # Détail des erreurs
    failed_pages = [page for page, success, code in page_results if not success]
    failed_apis = [api for api, success, code in api_results if not success]
    
    if failed_pages:
        print(f"\n❌ Pages en erreur: {', '.join(failed_pages)}")
    
    if failed_apis:
        print(f"❌ APIs en erreur: {', '.join(failed_apis)}")
    
    # Score global
    total_ok = pages_ok + api_ok
    total_tests = pages_total + api_total
    score = total_ok / total_tests * 100
    
    print(f"\n🎯 SCORE GLOBAL: {score:.1f}% ({total_ok}/{total_tests})")
    
    if score >= 90:
        print("🎉 EXCELLENT - Système prêt pour la production !")
    elif score >= 75:
        print("✅ BON - Quelques corrections mineures nécessaires")
    elif score >= 50:
        print("⚠️ MOYEN - Corrections importantes nécessaires")
    else:
        print("❌ CRITIQUE - Système non fonctionnel")

def main():
    print("🚀 DÉMARRAGE DES TESTS COMPLETS")
    print(f"🌐 URL de base: {BASE_URL}")
    print(f"⏰ Heure: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Vérifier que le serveur est accessible
    if not test_server_status():
        print("\n❌ ARRÊT: Serveur inaccessible")
        print("💡 Assurez-vous que le serveur est démarré avec:")
        print("   python src/backend/app.py")
        return
    
    # Tests principaux
    page_results = test_pages()
    api_results = test_api_endpoints()
    
    # Tests fonctionnels
    test_email_functionality()
    test_accessibility()
    test_database()
    
    # Rapport final
    generate_report(page_results, api_results)
    
    print(f"\n✅ Tests terminés à {datetime.now().strftime('%H:%M:%S')}")

if __name__ == "__main__":
    main()