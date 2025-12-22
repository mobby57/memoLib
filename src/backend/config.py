"""
Configuration et validation des variables d'environnement
"""
import os
import secrets
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional

# Charger les variables d'environnement
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)


class Config:
    """Configuration de l'application avec validation"""
    
    # =========================================================================
    # VARIABLES OBLIGATOIRES
    # =========================================================================
    
    @staticmethod
    def _get_required(key: str) -> str:
        """Récupérer une variable obligatoire"""
        value = os.getenv(key)
        if not value:
            raise EnvironmentError(
                f"❌ Variable d'environnement obligatoire manquante: {key}\n"
                f"   Consultez .env.template pour la configuration"
            )
        return value
    
    @staticmethod
    def _get_optional(key: str, default: Optional[str] = None) -> Optional[str]:
        """Récupérer une variable optionnelle"""
        return os.getenv(key, default)
    
    # =========================================================================
    # OPENAI
    # =========================================================================
    
    @property
    def OPENAI_API_KEY(self) -> str:
        key = self._get_required('OPENAI_API_KEY')
        if not key.startswith('sk-'):
            raise ValueError("OPENAI_API_KEY doit commencer par 'sk-'")
        return key
    
    @property
    def OPENAI_ORG_ID(self) -> Optional[str]:
        return self._get_optional('OPENAI_ORG_ID')
    
    @property
    def OPENAI_PROJECT_ID(self) -> Optional[str]:
        return self._get_optional('OPENAI_PROJECT_ID')
    
    # =========================================================================
    # FLASK
    # =========================================================================
    
    @property
    def SECRET_KEY(self) -> str:
        key = self._get_optional('SECRET_KEY')
        
        if not key or key == 'changez-moi-en-production-utiliser-secrets-urandom-32':
            if self.FLASK_ENV == 'production':
                raise EnvironmentError(
                    "❌ SECRET_KEY par défaut en production !\n"
                    "   Générez une clé sécurisée avec: python -c 'import secrets; print(secrets.token_hex(32))'"
                )
            # Génération automatique en développement
            key = secrets.token_hex(32)
            print("⚠️  SECRET_KEY générée automatiquement (développement)")
        
        return key
    
    @property
    def FLASK_ENV(self) -> str:
        return self._get_optional('FLASK_ENV', 'development')
    
    @property
    def FLASK_DEBUG(self) -> bool:
        return self._get_optional('FLASK_DEBUG', 'True').lower() == 'true'
    
    # =========================================================================
    # DATABASE
    # =========================================================================
    
    @property
    def DATABASE_URL(self) -> str:
        return self._get_optional('DATABASE_URL', 'sqlite:///iapostemanager.db')
    
    @property
    def DATABASE_POOL_SIZE(self) -> int:
        return int(self._get_optional('DATABASE_POOL_SIZE', '10'))
    
    @property
    def DATABASE_MAX_OVERFLOW(self) -> int:
        return int(self._get_optional('DATABASE_MAX_OVERFLOW', '20'))
    
    # =========================================================================
    # EMAIL
    # =========================================================================
    
    @property
    def SENDGRID_API_KEY(self) -> Optional[str]:
        return self._get_optional('SENDGRID_API_KEY')
    
    @property
    def SENDGRID_FROM_EMAIL(self) -> str:
        return self._get_optional('SENDGRID_FROM_EMAIL', 'noreply@iapostemanager.com')
    
    @property
    def SENDGRID_FROM_NAME(self) -> str:
        return self._get_optional('SENDGRID_FROM_NAME', 'IAPosteManager')
    
    # =========================================================================
    # LOGGING
    # =========================================================================
    
    @property
    def LOG_LEVEL(self) -> str:
        return self._get_optional('LOG_LEVEL', 'INFO')
    
    @property
    def SENTRY_DSN(self) -> Optional[str]:
        return self._get_optional('SENTRY_DSN')
    
    # =========================================================================
    # VALIDATION
    # =========================================================================
    
    def validate(self) -> bool:
        """Valider la configuration au démarrage"""
        try:
            # Vérifier les variables critiques
            _ = self.OPENAI_API_KEY
            _ = self.SECRET_KEY
            
            print("✅ Configuration validée")
            print(f"   - Environment: {self.FLASK_ENV}")
            print(f"   - Debug: {self.FLASK_DEBUG}")
            print(f"   - Database: {self.DATABASE_URL.split(':')[0]}")
            print(f"   - OpenAI: Configuré")
            
            if self.SENDGRID_API_KEY:
                print(f"   - SendGrid: Configuré")
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur de configuration: {e}")
            return False


# Instance globale
config = Config()
