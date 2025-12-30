"""
Script de test et validation de l'installation
Vérifie que tous les modules sont correctement installés et configurés
"""

import sys
import os

def print_status(message, status):
    """Affiche le statut avec couleurs"""
    if status:
        print(f"✅ {message}")
    else:
        print(f"❌ {message}")
    return status

def check_imports():
    """Vérifie que toutes les dépendances peuvent être importées"""
    print("\n" + "="*60)
    print("📦 VÉRIFICATION DES DÉPENDANCES")
    print("="*60)
    
    all_ok = True
    
    # Flask
    try:
        import flask
        try:
            from importlib.metadata import version
            flask_version = version('flask')
        except:
            flask_version = "OK"
        print_status(f"Flask {flask_version}", True)
    except ImportError as e:
        print_status(f"Flask: {e}", False)
        all_ok = False
    
    # Flask-CORS
    try:
        import flask_cors
        print_status("Flask-CORS", True)
    except ImportError as e:
        print_status(f"Flask-CORS: {e}", False)
        all_ok = False
    
    # Flask-Login
    try:
        import flask_login
        print_status("Flask-Login", True)
    except ImportError as e:
        print_status(f"Flask-Login: {e}", False)
        all_ok = False
    
    # Werkzeug
    try:
        import werkzeug
        print_status("Werkzeug", True)
    except ImportError as e:
        print_status(f"Werkzeug: {e}", False)
        all_ok = False
    
    # python-dateutil
    try:
        import dateutil
        print_status("python-dateutil", True)
    except ImportError as e:
        print_status(f"python-dateutil: {e}", False)
        all_ok = False
    
    return all_ok

def check_structure():
    """Vérifie la structure des dossiers"""
    print("\n" + "="*60)
    print("📁 VÉRIFICATION DE LA STRUCTURE")
    print("="*60)
    
    all_ok = True
    
    required_dirs = [
        'src/backend/services/legal',
        'src/backend/routes',
        'templates/legal',
        'static/css',
        'static/css/legal',
        'static/js',
        'static/js/legal',
        'data'
    ]
    
    for dir_path in required_dirs:
        exists = os.path.exists(dir_path)
        print_status(f"{dir_path}", exists)
        if not exists:
            all_ok = False
    
    return all_ok

def check_files():
    """Vérifie que tous les fichiers essentiels existent"""
    print("\n" + "="*60)
    print("📄 VÉRIFICATION DES FICHIERS")
    print("="*60)
    
    all_ok = True
    
    required_files = [
        'app.py',
        'requirements.txt',
        'src/backend/services/legal/__init__.py',
        'src/backend/services/legal/deadline_manager.py',
        'src/backend/services/legal/billing_manager.py',
        'src/backend/services/legal/compliance_manager.py',
        'src/backend/services/legal/advanced_templates.py',
        'src/backend/routes/legal_routes.py',
        'templates/legal/dashboard.html',
        'templates/legal/deadlines.html',
        'templates/legal/billing.html',
        'templates/legal/compliance.html',
        'templates/legal/reports.html',
        'static/js/toast.js',
        'static/css/toast.css'
    ]
    
    for file_path in required_files:
        exists = os.path.exists(file_path)
        print_status(f"{file_path}", exists)
        if not exists:
            all_ok = False
    
    return all_ok

def check_modules():
    """Vérifie que les modules juridiques peuvent être importés"""
    print("\n" + "="*60)
    print("⚖️  VÉRIFICATION DES MODULES JURIDIQUES")
    print("="*60)
    
    all_ok = True
    
    try:
        from src.backend.services.legal.deadline_manager import DeadlineManager
        print_status("DeadlineManager", True)
    except Exception as e:
        print_status(f"DeadlineManager: {e}", False)
        all_ok = False
    
    try:
        from src.backend.services.legal.billing_manager import BillingManager
        print_status("BillingManager", True)
    except Exception as e:
        print_status(f"BillingManager: {e}", False)
        all_ok = False
    
    try:
        from src.backend.services.legal.compliance_manager import ComplianceManager
        print_status("ComplianceManager", True)
    except Exception as e:
        print_status(f"ComplianceManager: {e}", False)
        all_ok = False
    
    try:
        from src.backend.services.legal.advanced_templates import TemplateGenerator
        print_status("TemplateGenerator", True)
    except Exception as e:
        print_status(f"TemplateGenerator: {e}", False)
        all_ok = False
    
    return all_ok

def test_modules():
    """Teste le fonctionnement basique des modules"""
    print("\n" + "="*60)
    print("🧪 TESTS FONCTIONNELS")
    print("="*60)
    
    all_ok = True
    
    # Test DeadlineManager
    try:
        from src.backend.services.legal.deadline_manager import DeadlineManager
        manager = DeadlineManager()
        result = manager.calculer_delai('2024-01-01', 30)
        print_status("DeadlineManager.calculer_delai()", result is not None)
    except Exception as e:
        print_status(f"DeadlineManager.calculer_delai(): {e}", False)
        all_ok = False
    
    # Test BillingManager
    try:
        from src.backend.services.legal.billing_manager import BillingManager
        billing = BillingManager()
        result = billing.enregistrer_temps('TEST-001', 'Test', 1.5, 150)
        print_status("BillingManager.enregistrer_temps()", result is not None)
    except Exception as e:
        print_status(f"BillingManager.enregistrer_temps(): {e}", False)
        all_ok = False
    
    # Test ComplianceManager
    try:
        from src.backend.services.legal.compliance_manager import ComplianceManager
        compliance = ComplianceManager()
        result = compliance.generer_numero_chrono('2024')
        print_status("ComplianceManager.generer_numero_chrono()", result is not None)
    except Exception as e:
        print_status(f"ComplianceManager.generer_numero_chrono(): {e}", False)
        all_ok = False
    
    return all_ok

def check_env():
    """Vérifie la configuration de l'environnement"""
    print("\n" + "="*60)
    print("🔧 CONFIGURATION ENVIRONNEMENT")
    print("="*60)
    
    all_ok = True
    
    # SECRET_KEY
    secret_key = os.getenv('SECRET_KEY')
    if secret_key and secret_key != 'dev-secret-key':
        print_status("SECRET_KEY configurée", True)
    else:
        print_status("SECRET_KEY par défaut (⚠️  Changez en production!)", True)
    
    # Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    is_valid_python = sys.version_info >= (3, 9)
    print_status(f"Python {python_version} (>= 3.9 requis)", is_valid_python)
    if not is_valid_python:
        all_ok = False
    
    return all_ok

def main():
    """Fonction principale"""
    print("\n" + "="*60)
    print("🚀 VALIDATION DE L'INSTALLATION")
    print("IA POSTE MANAGER - ÉDITION AVOCAT v3.0")
    print("="*60)
    
    results = {
        'dependencies': check_imports(),
        'structure': check_structure(),
        'files': check_files(),
        'modules': check_modules(),
        'tests': test_modules(),
        'env': check_env()
    }
    
    print("\n" + "="*60)
    print("📊 RÉSULTAT GLOBAL")
    print("="*60)
    
    for key, value in results.items():
        print_status(key.upper(), value)
    
    all_ok = all(results.values())
    
    print("\n" + "="*60)
    if all_ok:
        print("✅ INSTALLATION VALIDÉE - TOUS LES TESTS PASSENT")
        print("\n🚀 Vous pouvez lancer l'application :")
        print("   python app.py")
        print("\n🌐 Accès :")
        print("   http://localhost:5000/login")
        print("   Compte démo: admin / admin123")
    else:
        print("❌ ERREURS DÉTECTÉES - VÉRIFIEZ LES MESSAGES CI-DESSUS")
        print("\n📝 Solutions possibles :")
        print("   1. Installer les dépendances: pip install -r requirements.txt")
        print("   2. Vérifier la structure des dossiers")
        print("   3. Vérifier que tous les fichiers sont présents")
    print("="*60 + "\n")
    
    return 0 if all_ok else 1

if __name__ == '__main__':
    sys.exit(main())
