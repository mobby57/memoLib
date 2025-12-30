"""
Validateur de configuration de sécurité
========================================

Vérifie que toutes les variables de sécurité critiques sont correctement configurées.
Doit être appelé au démarrage de l'application.
"""

import os
import sys
from pathlib import Path
from typing import List, Tuple

# Charger les variables d'environnement depuis .env
try:
    from dotenv import load_dotenv
    # Charger le .env depuis la racine du projet
    env_path = Path(__file__).parent.parent / '.env'
    load_dotenv(env_path)
except ImportError:
    print("⚠️  python-dotenv non installé. Exécutez: pip install python-dotenv")


class SecurityConfigValidator:
    """Valide la configuration de sécurité"""
    
    # Variables critiques obligatoires
    REQUIRED_VARS = [
        'MASTER_ENCRYPTION_KEY',
        'JWT_SECRET_KEY',
        'FLASK_SECRET_KEY'
    ]
    
    # Variables recommandées
    RECOMMENDED_VARS = [
        'OPENAI_API_KEY',
        'SMTP_USERNAME',
        'SMTP_PASSWORD',
        'DATABASE_URL'
    ]
    
    # Longueur minimale des clés
    MIN_KEY_LENGTH = {
        'MASTER_ENCRYPTION_KEY': 32,
        'JWT_SECRET_KEY': 32,
        'FLASK_SECRET_KEY': 24,
        'WEBHOOK_SECRET': 24
    }
    
    def __init__(self, strict: bool = True):
        """
        Initialise le validateur
        
        Args:
            strict: Si True, échoue sur variables manquantes critiques
        """
        self.strict = strict
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate_required_vars(self) -> bool:
        """Vérifie que toutes les variables requises sont définies"""
        
        missing = []
        for var in self.REQUIRED_VARS:
            if not os.getenv(var):
                missing.append(var)
                self.errors.append(f"Variable manquante : {var}")
        
        if missing:
            return False
        
        return True
    
    def validate_key_lengths(self) -> bool:
        """Vérifie que les clés ont une longueur suffisante"""
        
        weak_keys = []
        
        for var, min_length in self.MIN_KEY_LENGTH.items():
            value = os.getenv(var)
            if value and len(value) < min_length:
                weak_keys.append((var, len(value), min_length))
                self.errors.append(
                    f"{var} trop courte : {len(value)} chars "
                    f"(minimum {min_length})"
                )
        
        return len(weak_keys) == 0
    
    def validate_recommended_vars(self) -> None:
        """Vérifie les variables recommandées (warnings uniquement)"""
        
        for var in self.RECOMMENDED_VARS:
            if not os.getenv(var):
                self.warnings.append(f"Variable recommandée manquante : {var}")
    
    def validate_env_file_exists(self) -> bool:
        """Vérifie que le fichier .env existe"""
        
        env_file = Path('.env')
        
        if not env_file.exists():
            self.errors.append(
                "Fichier .env manquant. "
                "Exécutez : python scripts/init_security.py"
            )
            return False
        
        return True
    
    def validate_gitignore(self) -> bool:
        """Vérifie que .env est dans .gitignore"""
        
        gitignore = Path('.gitignore')
        
        if not gitignore.exists():
            self.warnings.append(".gitignore manquant")
            return True  # Warning seulement
        
        content = gitignore.read_text()
        
        if '.env' not in content:
            self.errors.append(
                ".env doit être dans .gitignore pour éviter "
                "les commits accidentels de secrets"
            )
            return False
        
        return True
    
    def validate_production_mode(self) -> bool:
        """Validation spécifique pour la production"""
        
        debug = os.getenv('DEBUG', 'false').lower() == 'true'
        env = os.getenv('ENV', 'development')
        
        if env == 'production' or not debug:
            # En production, toutes les clés sont obligatoires
            all_vars = self.REQUIRED_VARS + self.RECOMMENDED_VARS
            
            missing = [var for var in all_vars if not os.getenv(var)]
            
            if missing:
                self.errors.append(
                    f"Variables manquantes en production : {', '.join(missing)}"
                )
                return False
        
        return True
    
    def validate_all(self) -> Tuple[bool, List[str], List[str]]:
        """
        Exécute toutes les validations
        
        Returns:
            (success, errors, warnings)
        """
        
        checks = [
            self.validate_env_file_exists(),
            self.validate_required_vars(),
            self.validate_key_lengths(),
            self.validate_gitignore(),
            self.validate_production_mode()
        ]
        
        # Warnings (ne bloquent pas)
        self.validate_recommended_vars()
        
        success = all(checks)
        
        return success, self.errors, self.warnings
    
    def print_report(self) -> None:
        """Affiche le rapport de validation"""
        
        print("=" * 60)
        print("  VALIDATION DE LA CONFIGURATION DE SÉCURITÉ")
        print("=" * 60)
        print()
        
        # Erreurs
        if self.errors:
            print("❌ ERREURS CRITIQUES :")
            for error in self.errors:
                print(f"   • {error}")
            print()
        
        # Warnings
        if self.warnings:
            print("⚠️  AVERTISSEMENTS :")
            for warning in self.warnings:
                print(f"   • {warning}")
            print()
        
        # Résumé
        if not self.errors and not self.warnings:
            print("✅ CONFIGURATION VALIDÉE")
            print("   Tous les contrôles de sécurité sont passés.")
        elif not self.errors:
            print("✅ CONFIGURATION VALIDE")
            print(f"   {len(self.warnings)} avertissement(s) à vérifier.")
        else:
            print("❌ CONFIGURATION INVALIDE")
            print(f"   {len(self.errors)} erreur(s) critique(s) à corriger.")
        
        print()


def validate_security_config(strict: bool = True, exit_on_error: bool = True) -> bool:
    """
    Fonction raccourci pour valider la configuration
    
    Args:
        strict: Mode strict (échoue sur erreurs critiques)
        exit_on_error: Quitte le programme si erreurs
    
    Returns:
        True si validation réussie
    """
    
    validator = SecurityConfigValidator(strict=strict)
    success, errors, warnings = validator.validate_all()
    
    validator.print_report()
    
    if not success and exit_on_error:
        print("🛑 Arrêt du programme pour raisons de sécurité")
        print()
        print("Pour corriger :")
        print("   1. Exécutez : python scripts/init_security.py")
        print("   2. Éditez .env avec vos vraies valeurs")
        print("   3. Relancez l'application")
        print()
        sys.exit(1)
    
    return success


if __name__ == '__main__':
    validate_security_config()
