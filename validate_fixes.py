#!/usr/bin/env python3
"""
Script de validation rapide des corrections critiques
Exécute des tests de base sans dépendances externes
"""

import os
import sys
import json
import requests
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
TEST_EMAIL = "test@example.com"

def print_status(message, status="INFO"):
    """Affiche un message avec timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    icons = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
    print(f"[{timestamp}] {icons.get(status, '•')} {message}")

def test_server_health():
    """Test si le serveur répond"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_status(f"Serveur actif: {data.get('service', 'Unknown')}", "SUCCESS")
            return True
        else:
            print_status(f"Serveur répond avec code {response.status_code}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"Serveur inaccessible: {e}", "ERROR")
        return False

def test_email_validation():
    """Test validation format email"""
    test_cases = [
        ("invalid-email", False),
        ("test@", False),
        ("@example.com", False),
        ("test@example.com", True),
        ("user.name+tag@example.co.uk", True)
    ]
    
    for email, should_pass in test_cases:
        try:
            response = requests.post(f"{BASE_URL}/api/send-email", 
                                   json={
                                       "to": email,
                                       "subject": "Test",
                                       "content": "Test content"
                                   }, timeout=5)
            
            if should_pass:
                if response.status_code == 200:
                    print_status(f"Email valide accepté: {email}", "SUCCESS")
                else:
                    print_status(f"Email valide rejeté: {email}", "ERROR")
            else:
                if response.status_code == 400:
                    print_status(f"Email invalide rejeté: {email}", "SUCCESS")
                else:
                    print_status(f"Email invalide accepté: {email}", "ERROR")
                    
        except requests.exceptions.RequestException as e:
            print_status(f"Erreur test email {email}: {e}", "ERROR")

def test_smtp_configuration():
    """Test configuration SMTP"""
    smtp_vars = ['SMTP_USER', 'SMTP_PASSWORD', 'SMTP_SERVER', 'SMTP_PORT']
    configured = []
    
    for var in smtp_vars:
        if os.getenv(var):
            configured.append(var)
    
    if len(configured) == len(smtp_vars):
        print_status("Configuration SMTP complète", "SUCCESS")
        return True
    else:
        missing = set(smtp_vars) - set(configured)
        print_status(f"Configuration SMTP incomplète. Manque: {', '.join(missing)}", "WARNING")
        return False

def test_email_sending():
    """Test envoi d'email (stockage ou envoi réel)"""
    try:
        response = requests.post(f"{BASE_URL}/api/send-email", 
                               json={
                                   "to": TEST_EMAIL,
                                   "subject": "Test IA Poste Manager",
                                   "content": "Ceci est un test automatique du système."
                               }, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            status = data.get('status', 'unknown')
            
            if status == 'sent':
                print_status("Email envoyé avec succès via SMTP", "SUCCESS")
            elif status == 'stored':
                print_status("Email stocké (SMTP non configuré)", "WARNING")
            else:
                print_status(f"Statut email inconnu: {status}", "ERROR")
                
            return True
        else:
            print_status(f"Échec envoi email: {response.status_code}", "ERROR")
            return False
            
    except requests.exceptions.RequestException as e:
        print_status(f"Erreur envoi email: {e}", "ERROR")
        return False

def test_ai_generation():
    """Test génération IA"""
    try:
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json={
                                   "prompt": "Rédigez un email de remerciement professionnel"
                               }, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            content = data.get('content', '')
            
            if len(content) > 50:
                print_status("Génération IA fonctionnelle", "SUCCESS")
                return True
            else:
                print_status("Génération IA trop courte", "WARNING")
                return False
        else:
            print_status(f"Échec génération IA: {response.status_code}", "ERROR")
            return False
            
    except requests.exceptions.RequestException as e:
        print_status(f"Erreur génération IA: {e}", "ERROR")
        return False

def test_data_persistence():
    """Test persistance des données"""
    data_files = [
        'data/emails.json',
        'data/templates.json', 
        'data/contacts.json'
    ]
    
    all_exist = True
    for file_path in data_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    json.load(f)
                print_status(f"Fichier données valide: {file_path}", "SUCCESS")
            except json.JSONDecodeError:
                print_status(f"Fichier données corrompu: {file_path}", "ERROR")
                all_exist = False
        else:
            print_status(f"Fichier données manquant: {file_path}", "WARNING")
    
    return all_exist

def test_security_headers():
    """Test headers de sécurité basiques"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        headers = response.headers
        
        # Check basic security headers
        security_checks = []
        
        if 'X-Content-Type-Options' in headers:
            security_checks.append("X-Content-Type-Options présent")
        
        if response.status_code == 200:
            print_status("Page d'accueil accessible", "SUCCESS")
        
        if security_checks:
            print_status(f"Sécurité: {', '.join(security_checks)}", "SUCCESS")
        else:
            print_status("Headers de sécurité manquants", "WARNING")
            
        return True
        
    except requests.exceptions.RequestException as e:
        print_status(f"Erreur test sécurité: {e}", "ERROR")
        return False

def main():
    """Exécute tous les tests de validation"""
    print_status("🚀 Début validation IA Poste Manager", "INFO")
    print_status("=" * 50, "INFO")
    
    tests = [
        ("Santé serveur", test_server_health),
        ("Configuration SMTP", test_smtp_configuration),
        ("Validation emails", test_email_validation),
        ("Envoi d'email", test_email_sending),
        ("Génération IA", test_ai_generation),
        ("Persistance données", test_data_persistence),
        ("Sécurité de base", test_security_headers)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print_status(f"Test: {test_name}", "INFO")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_status(f"Erreur inattendue dans {test_name}: {e}", "ERROR")
            results.append((test_name, False))
        
        print_status("-" * 30, "INFO")
    
    # Résumé
    print_status("📊 RÉSUMÉ DES TESTS", "INFO")
    print_status("=" * 50, "INFO")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "SUCCESS" if result else "ERROR"
        print_status(f"{test_name}: {'PASS' if result else 'FAIL'}", status)
    
    print_status("=" * 50, "INFO")
    print_status(f"Score: {passed}/{total} tests réussis ({passed/total*100:.1f}%)", 
                "SUCCESS" if passed == total else "WARNING")
    
    if passed == total:
        print_status("🎉 Toutes les corrections critiques validées!", "SUCCESS")
    elif passed >= total * 0.8:
        print_status("⚠️ Corrections majoritairement validées, quelques ajustements nécessaires", "WARNING")
    else:
        print_status("❌ Corrections insuffisantes, révision nécessaire", "ERROR")

if __name__ == "__main__":
    main()