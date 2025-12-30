"""
Script de vérification rapide du MVP
====================================

Vérifie que tous les composants sont opérationnels.
"""

import sys
import os
from pathlib import Path
from typing import List, Tuple

# Couleurs pour le terminal
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str):
    """Affiche un header"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")


def check_file(filepath: str, description: str) -> bool:
    """Vérifie qu'un fichier existe"""
    exists = Path(filepath).exists()
    status = f"{Colors.GREEN}✅{Colors.ENDC}" if exists else f"{Colors.RED}❌{Colors.ENDC}"
    print(f"{status} {description}")
    if not exists:
        print(f"   {Colors.RED}Manquant : {filepath}{Colors.ENDC}")
    return exists


def check_import(module_name: str, description: str) -> bool:
    """Vérifie qu'un module peut être importé"""
    try:
        __import__(module_name)
        print(f"{Colors.GREEN}✅{Colors.ENDC} {description}")
        return True
    except ImportError as e:
        print(f"{Colors.RED}❌{Colors.ENDC} {description}")
        print(f"   {Colors.RED}Erreur : {e}{Colors.ENDC}")
        return False


def check_env_var(var_name: str, description: str, required: bool = True) -> bool:
    """Vérifie qu'une variable d'environnement est définie"""
    value = os.getenv(var_name)
    exists = value is not None and value != ""
    
    if required:
        status = f"{Colors.GREEN}✅{Colors.ENDC}" if exists else f"{Colors.RED}❌{Colors.ENDC}"
    else:
        status = f"{Colors.GREEN}✅{Colors.ENDC}" if exists else f"{Colors.YELLOW}⚠️{Colors.ENDC}"
    
    print(f"{status} {description}")
    if not exists and required:
        print(f"   {Colors.RED}Manquant dans .env : {var_name}{Colors.ENDC}")
    elif not exists:
        print(f"   {Colors.YELLOW}Optionnel : {var_name}{Colors.ENDC}")
    
    return exists if required else True


def main():
    """Exécute toutes les vérifications"""
    
    print_header("🔍 VÉRIFICATION DU MVP IA POSTE MANAGER")
    
    all_checks_passed = True
    
    # ========================================================================
    # 1. FICHIERS PRINCIPAUX
    # ========================================================================
    print_header("1️⃣ Fichiers Principaux")
    
    files_to_check = [
        ("src/backend/mvp_orchestrator.py", "Orchestrateur MVP"),
        ("src/backend/api_mvp.py", "API REST MVP"),
        ("src/backend/dashboard.py", "Dashboard"),
        ("src/backend/services/workspace_service.py", "Workspace Service"),
        ("src/backend/services/human_thought_sim.py", "Human Thought Simulator"),
        ("src/backend/services/responder.py", "Responder Service"),
        ("src/backend/services/form_generator.py", "Form Generator"),
        ("src/backend/services/logger.py", "Logger Service"),
        ("security/secrets_manager.py", "Secrets Manager"),
        ("security/encryption.py", "Encryption"),
        ("security/middleware.py", "Security Middleware"),
        ("security/config_validator.py", "Config Validator"),
    ]
    
    for filepath, description in files_to_check:
        if not check_file(filepath, description):
            all_checks_passed = False
    
    # ========================================================================
    # 2. TESTS
    # ========================================================================
    print_header("2️⃣ Tests")
    
    test_files = [
        ("tests/test_security_compliance.py", "Tests de sécurité"),
        ("tests/test_mvp_integration.py", "Tests d'intégration MVP"),
    ]
    
    for filepath, description in test_files:
        if not check_file(filepath, description):
            all_checks_passed = False
    
    # ========================================================================
    # 3. DOCUMENTATION
    # ========================================================================
    print_header("3️⃣ Documentation")
    
    doc_files = [
        ("docs/MVP_QUICKSTART.md", "Guide de démarrage rapide"),
        ("docs/SECURITY_GUIDE.md", "Guide de sécurité"),
        ("CHANGELOG.md", "Changelog"),
        ("README.md", "README principal"),
    ]
    
    for filepath, description in doc_files:
        if not check_file(filepath, description):
            all_checks_passed = False
    
    # ========================================================================
    # 4. CONFIGURATION
    # ========================================================================
    print_header("4️⃣ Configuration")
    
    config_files = [
        (".env", "Variables d'environnement"),
        ("config/mvp.env", "Configuration MVP"),
        ("requirements.txt", "Dépendances Python"),
    ]
    
    for filepath, description in config_files:
        if not check_file(filepath, description):
            all_checks_passed = False
    
    # ========================================================================
    # 5. VARIABLES D'ENVIRONNEMENT
    # ========================================================================
    print_header("5️⃣ Variables d'Environnement")
    
    # Charger .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print(f"{Colors.GREEN}✅{Colors.ENDC} Fichier .env chargé")
    except Exception as e:
        print(f"{Colors.RED}❌{Colors.ENDC} Erreur chargement .env : {e}")
        all_checks_passed = False
    
    env_vars_required = [
        ("MASTER_ENCRYPTION_KEY", "Clé de chiffrement maître"),
        ("JWT_SECRET_KEY", "Secret JWT"),
        ("FLASK_SECRET_KEY", "Secret Flask"),
    ]
    
    env_vars_optional = [
        ("OPENAI_API_KEY", "Clé API OpenAI (optionnel)"),
        ("DATABASE_URL", "URL base de données (optionnel)"),
        ("REDIS_URL", "URL Redis (optionnel)"),
    ]
    
    for var_name, description in env_vars_required:
        if not check_env_var(var_name, description, required=True):
            all_checks_passed = False
    
    for var_name, description in env_vars_optional:
        check_env_var(var_name, description, required=False)
    
    # ========================================================================
    # 6. DÉPENDANCES PYTHON
    # ========================================================================
    print_header("6️⃣ Dépendances Python")
    
    dependencies = [
        ("cryptography", "Cryptography"),
        ("jwt", "PyJWT"),
        ("dotenv", "python-dotenv"),
        ("flask", "Flask"),
        ("flask_cors", "Flask-CORS"),
        ("pytest", "pytest"),
    ]
    
    for module_name, description in dependencies:
        if not check_import(module_name, description):
            print(f"   {Colors.YELLOW}Installer avec : pip install {module_name}{Colors.ENDC}")
            all_checks_passed = False
    
    # ========================================================================
    # 7. SCRIPTS
    # ========================================================================
    print_header("7️⃣ Scripts")
    
    script_files = [
        ("start_mvp.ps1", "Script de démarrage PowerShell"),
        ("examples/client_api_example.py", "Client API exemple"),
    ]
    
    for filepath, description in script_files:
        if not check_file(filepath, description):
            all_checks_passed = False
    
    # ========================================================================
    # RÉSULTAT FINAL
    # ========================================================================
    print_header("📊 RÉSULTAT")
    
    if all_checks_passed:
        print(f"{Colors.GREEN}{Colors.BOLD}✅ TOUS LES COMPOSANTS SONT OPÉRATIONNELS{Colors.ENDC}")
        print(f"\n{Colors.GREEN}Le MVP est prêt à être lancé !{Colors.ENDC}")
        print(f"\n{Colors.BLUE}Commandes de démarrage :{Colors.ENDC}")
        print(f"  • API MVP      : {Colors.YELLOW}.\\start_mvp.ps1{Colors.ENDC}")
        print(f"  • Dashboard    : {Colors.YELLOW}python src\\backend\\dashboard.py{Colors.ENDC}")
        print(f"  • Tests        : {Colors.YELLOW}pytest tests/ -v{Colors.ENDC}")
        print(f"  • Client test  : {Colors.YELLOW}python examples\\client_api_example.py{Colors.ENDC}")
        print()
        return 0
    else:
        print(f"{Colors.RED}{Colors.BOLD}❌ CERTAINS COMPOSANTS SONT MANQUANTS{Colors.ENDC}")
        print(f"\n{Colors.YELLOW}Veuillez corriger les erreurs ci-dessus avant de continuer.{Colors.ENDC}")
        print()
        return 1


if __name__ == '__main__':
    sys.exit(main())
