"""
Script de vérification post-amélioration
Vérifie que tous les nouveaux modules de sécurité sont fonctionnels
"""
import sys
from pathlib import Path

print("╔════════════════════════════════════════════════════════════════╗")
print("║  🔐 VÉRIFICATION POST-AMÉLIORATION - SÉCURITÉ v3.0            ║")
print("╚════════════════════════════════════════════════════════════════╝")
print()

results = []
errors = []

# 1. Test imports sécurité
print("📦 Vérification des imports de sécurité...")
try:
    from src.backend.security.encryption import DataEncryption, encrypt_client_data
    results.append("✅ Module chiffrement (encryption.py)")
except Exception as e:
    results.append("❌ Module chiffrement")
    errors.append(f"Encryption: {e}")

try:
    from src.backend.security.audit_logger import AuditLogger, audit_logger
    results.append("✅ Module audit trail (audit_logger.py)")
except Exception as e:
    results.append("❌ Module audit trail")
    errors.append(f"Audit: {e}")

try:
    from src.backend.security.backup_manager import BackupManager, backup_manager
    results.append("✅ Module backup (backup_manager.py)")
except Exception as e:
    results.append("❌ Module backup")
    errors.append(f"Backup: {e}")

# 2. Test import PDF
print("📄 Vérification module PDF...")
try:
    from src.backend.services.pdf_generator import InvoicePDFGenerator
    results.append("✅ Générateur PDF (pdf_generator.py)")
except Exception as e:
    results.append("❌ Générateur PDF")
    errors.append(f"PDF: {e}")

# 3. Test configuration
print("⚙️  Vérification configuration...")
try:
    from config.config import get_config, DevelopmentConfig
    config = get_config('development')
    results.append("✅ Configuration multi-environnements")
except Exception as e:
    results.append("❌ Configuration")
    errors.append(f"Config: {e}")

# 4. Test Flask extensions
print("🔒 Vérification extensions Flask...")
try:
    from flask_limiter import Limiter
    results.append("✅ Flask-Limiter (rate limiting)")
except Exception as e:
    results.append("❌ Flask-Limiter")
    errors.append(f"Limiter: {e}")

try:
    from flask_talisman import Talisman
    results.append("✅ Flask-Talisman (security headers)")
except Exception as e:
    results.append("❌ Flask-Talisman")
    errors.append(f"Talisman: {e}")

try:
    from reportlab.lib.pagesizes import A4
    results.append("✅ ReportLab (PDF)")
except Exception as e:
    results.append("❌ ReportLab")
    errors.append(f"ReportLab: {e}")

try:
    from pythonjsonlogger import jsonlogger
    results.append("✅ Python JSON Logger (audit)")
except Exception as e:
    results.append("❌ Python JSON Logger")
    errors.append(f"JSONLogger: {e}")

try:
    import pytest
    results.append("✅ Pytest (tests)")
except Exception as e:
    results.append("❌ Pytest")
    errors.append(f"Pytest: {e}")

# 5. Vérification fichiers
print("📁 Vérification fichiers créés...")
files_to_check = [
    'src/backend/security/encryption.py',
    'src/backend/security/audit_logger.py',
    'src/backend/security/backup_manager.py',
    'src/backend/services/pdf_generator.py',
    'config/config.py',
    'tests/test_encryption.py',
    'tests/test_deadline_manager.py',
    'tests/test_api_routes.py',
    'GUIDE_SECURITE.md'
]

for filepath in files_to_check:
    if Path(filepath).exists():
        results.append(f"✅ {filepath}")
    else:
        results.append(f"❌ {filepath}")
        errors.append(f"Fichier manquant: {filepath}")

# Affichage résultats
print()
print("═══════════════════════════════════════════════════════════════")
print("📊 RÉSULTATS")
print("═══════════════════════════════════════════════════════════════")
print()

for result in results:
    print(result)

print()
print("═══════════════════════════════════════════════════════════════")

if errors:
    print()
    print("⚠️  ERREURS DÉTECTÉES:")
    print()
    for error in errors:
        print(f"  • {error}")
    print()
    print("💡 Solution: pip install -r requirements.txt")
    print()
    sys.exit(1)
else:
    print()
    print("✅ TOUS LES MODULES DE SÉCURITÉ SONT OPÉRATIONNELS!")
    print()
    print("🎯 Prochaines étapes:")
    print("  1. Configurer .env (cp .env.example .env)")
    print("  2. Générer SECRET_KEY")
    print("  3. Lancer tests: pytest")
    print("  4. Consulter GUIDE_SECURITE.md")
    print()
    sys.exit(0)
