#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test complet de SecureVault - Vérifie que tout marche
"""

import os
import sys
import subprocess

def run_test(test_file, description):
    """Exécute un fichier de test"""
    print(f"\n{'='*60}")
    print(f"EXÉCUTION: {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run([sys.executable, test_file], 
                              capture_output=True, text=True, timeout=30)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("TIMEOUT: Test trop long")
        return False
    except Exception as e:
        print(f"ERREUR: {e}")
        return False

def main():
    """Point d'entrée principal"""
    print("SECUREVAULT - SUITE DE TESTS COMPLÈTE")
    print("Vérification que toute l'application fonctionne correctement")
    
    # Vérifier qu'on est dans le bon répertoire
    if not os.path.exists("src/web/app.py"):
        print("\nERREUR: Exécutez ce script depuis le répertoire racine du projet")
        print("Structure attendue:")
        print("  iaPostemanage/")
        print("  ├── src/web/app.py")
        print("  ├── requirements.txt")
        print("  └── test_complet.py")
        return False
    
    tests = [
        ("test_simple.py", "Tests de base (structure, imports, crypto)"),
    ]
    
    # Ajouter le test fonctionnel si requests est disponible
    try:
        import requests
        tests.append(("test_fonctionnel.py", "Tests fonctionnels (application en marche)"))
    except ImportError:
        print("\nINFO: Module 'requests' non disponible, tests fonctionnels ignorés")
        print("Pour installer: pip install requests")
    
    passed = 0
    total = len(tests)
    
    for test_file, description in tests:
        if os.path.exists(test_file):
            if run_test(test_file, description):
                passed += 1
                print(f"OK {description} - REUSSI")
            else:
                print(f"ERREUR {description} - ECHOUE")
        else:
            print(f"ERREUR {test_file} non trouve")
    
    print(f"\n{'='*60}")
    print(f"RÉSULTATS FINAUX: {passed}/{total} suites de tests réussies")
    print(f"{'='*60}")
    
    if passed == total:
        print("SUCCES COMPLET!")
        print("\nL'application SecureVault est prête à être utilisée:")
        print("1. Installez les dépendances: pip install -r requirements.txt")
        print("2. Lancez l'application: python src/web/app.py")
        print("3. Ouvrez votre navigateur: http://127.0.0.1:5000")
        print("\nFonctionnalités disponibles:")
        print("- Chiffrement sécurisé des credentials")
        print("- Envoi d'emails via Gmail")
        print("- Génération IA avec OpenAI")
        print("- Interface web responsive")
        print("- Mode sombre/clair")
        return True
    else:
        print("ECHECS DETECTES")
        print("\nActions recommandées:")
        print("1. Vérifiez les dépendances: pip install -r requirements.txt")
        print("2. Vérifiez la structure des fichiers")
        print("3. Consultez les logs d'erreur ci-dessus")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)