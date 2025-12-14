#!/usr/bin/env python3
"""Script de test pour identifier les manques dans IAPosteManager"""

import os
import sys
import importlib
from pathlib import Path

# Ajouter le répertoire racine au path
sys.path.insert(0, os.path.dirname(__file__))

def test_imports():
    """Teste tous les imports critiques"""
    print("=== TEST DES IMPORTS ===")
    
    imports_to_test = [
        # Core modules
        ('src.core.config', 'Config'),
        ('src.core.crypto_utils', None),
        ('src.core.database', 'Database'),
        ('src.core.logging_config', 'setup_logging'),
        ('src.core.session_manager', 'SessionManager'),
        ('src.core.template_manager', 'TemplateManager'),
        ('src.core.validation', 'EmailValidator'),
        ('src.core.user_manager', 'UserManager'),
        ('src.core.jwt_manager', 'jwt_manager'),
        ('src.core.rate_limiter', 'rate_limiter'),
        ('src.core.cache_manager', 'cache'),
        
        # Services
        ('src.services.smtp_service', 'SMTPService'),
        ('src.services.openai_service', 'OpenAIService'),
        ('src.services.inbox_manager', 'InboxManager'),
        ('src.services.realtime_transcription', 'RealtimeTranscriptionWebSocket'),
        
        # Analytics
        ('src.analytics.advanced_analytics', 'AdvancedAnalytics'),
        
        # Monitoring
        ('src.monitoring.prometheus', 'metrics_endpoint'),
        
        # API
        ('src.api.v1', 'api_v1'),
        ('src.api.smart_email', 'smart_bp'),
        ('src.web.email_routes', 'email_bp'),
        
        # Security
        ('src.security.two_factor_auth', 'TwoFactorAuth'),
        ('src.security.audit_trail', 'AuditTrail'),
        
        # Accessibility
        ('src.accessibility.tts_service', 'TTSService'),
        ('src.accessibility.universal_access', 'accessibility_service'),
        
        # Automation
        ('src.automation.email_scheduler', 'EmailScheduler'),
        
        # API REST
        ('src.api.rest_endpoints', 'api_bp'),
    ]
    
    missing_modules = []
    missing_classes = []
    
    for module_name, class_name in imports_to_test:
        try:
            module = importlib.import_module(module_name)
            print(f"OK {module_name}")
            
            if class_name:
                if hasattr(module, class_name):
                    print(f"   OK {class_name}")
                else:
                    print(f"   MANQUE {class_name}")
                    missing_classes.append(f"{module_name}.{class_name}")
                    
        except ImportError as e:
            print(f"MANQUE {module_name} - {e}")
            missing_modules.append(module_name)
    
    return missing_modules, missing_classes

def check_file_structure():
    """Vérifie la structure des fichiers selon le README"""
    print("\n=== VERIFICATION STRUCTURE FICHIERS ===")
    
    required_files = [
        'src/web/app.py',
        'src/core/config.py',
        'src/core/crypto_utils.py',
        'src/core/database.py',
        'src/services/ai_service.py',
        'src/services/email_service.py',
        'src/services/voice_service.py',
        'src/accessibility/',
        'src/security/',
        'src/analytics/',
        'src/payment/',
        'templates/',
        'static/',
        'data/',
        'tests/',
        'docs/',
        'deploy/',
        'docker-compose.yml',
        'requirements.txt',
        '.env.example'
    ]
    
    missing_files = []
    
    for file_path in required_files:
        full_path = Path(file_path)
        if full_path.exists():
            print(f"OK {file_path}")
        else:
            print(f"MANQUE {file_path}")
            missing_files.append(file_path)
    
    return missing_files

def check_dependencies():
    """Vérifie les dépendances Python"""
    print("\n=== VERIFICATION DEPENDANCES ===")
    
    required_deps = [
        'flask',
        'flask_cors',
        'cryptography',
        'python-dotenv',
        'gunicorn',
        'openai',
        'pyttsx3',
        'SpeechRecognition',
        'stripe',
        'boto3',
        'flask_socketio',
        'flask_session'
    ]
    
    missing_deps = []
    
    for dep in required_deps:
        try:
            importlib.import_module(dep.replace('-', '_'))
            print(f"OK {dep}")
        except ImportError:
            print(f"MANQUE {dep}")
            missing_deps.append(dep)
    
    return missing_deps

def generate_missing_files():
    """Génère les fichiers manquants critiques"""
    print("\n=== GENERATION FICHIERS MANQUANTS ===")
    
    # Créer les dossiers manquants
    dirs_to_create = [
        'src/core',
        'src/services', 
        'src/accessibility',
        'src/security',
        'src/analytics',
        'src/payment',
        'src/api/v1',
        'src/web',
        'data/encrypted',
        'data/uploads',
        'logs',
        'uploads'
    ]
    
    for dir_path in dirs_to_create:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"DOSSIER Cree: {dir_path}")
    
    # Créer les fichiers __init__.py manquants
    init_files = [
        'src/__init__.py',
        'src/core/__init__.py',
        'src/services/__init__.py',
        'src/accessibility/__init__.py',
        'src/security/__init__.py',
        'src/analytics/__init__.py',
        'src/payment/__init__.py',
        'src/api/__init__.py',
        'src/api/v1/__init__.py',
        'src/web/__init__.py'
    ]
    
    for init_file in init_files:
        if not Path(init_file).exists():
            Path(init_file).write_text('"""Module init"""')
            print(f"FICHIER Cree: {init_file}")

def main():
    """Fonction principale"""
    print("IAPosteManager v2.2 - Test des manques")
    print("=" * 50)
    
    # Test des imports
    missing_modules, missing_classes = test_imports()
    
    # Vérification structure
    missing_files = check_file_structure()
    
    # Vérification dépendances
    missing_deps = check_dependencies()
    
    # Génération fichiers manquants
    generate_missing_files()
    
    # Résumé
    print("\n" + "=" * 50)
    print("RESUME DES MANQUES")
    print("=" * 50)
    
    if missing_modules:
        print(f"\nMODULES MANQUANTS ({len(missing_modules)}):")
        for module in missing_modules:
            print(f"   - {module}")
    
    if missing_classes:
        print(f"\nCLASSES MANQUANTES ({len(missing_classes)}):")
        for class_name in missing_classes:
            print(f"   - {class_name}")
    
    if missing_files:
        print(f"\nFICHIERS MANQUANTS ({len(missing_files)}):")
        for file_path in missing_files:
            print(f"   - {file_path}")
    
    if missing_deps:
        print(f"\nDEPENDANCES MANQUANTES ({len(missing_deps)}):")
        for dep in missing_deps:
            print(f"   - {dep}")
        print(f"\nPour installer: pip install {' '.join(missing_deps)}")
    
    if not any([missing_modules, missing_classes, missing_files, missing_deps]):
        print("\nTOUT EST OK!")
    
    print("\n" + "=" * 50)

if __name__ == '__main__':
    main()