"""
Configuration des environnements (Development, Production, Testing)
"""
import os
from pathlib import Path
from datetime import timedelta


class Config:
    """Configuration de base"""
    
    # Chemins
    BASE_DIR = Path(__file__).parent.parent
    DATA_DIR = BASE_DIR / 'data'
    LOGS_DIR = BASE_DIR / 'logs'
    BACKUP_DIR = BASE_DIR / 'backups'
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JSON_AS_ASCII = False
    
    # Sessions
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    
    # Rate Limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = 'memory://'
    
    # Backup
    BACKUP_RETENTION_DAYS = 30
    BACKUP_ENABLED = True
    
    # Email (si configuré)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@cabinet-avocat.fr')


class DevelopmentConfig(Config):
    """Configuration développement"""
    
    DEBUG = True
    TESTING = False
    
    # Session non sécurisée en dev (HTTP)
    SESSION_COOKIE_SECURE = False
    
    # Pas de HTTPS forcé
    FORCE_HTTPS = False
    
    # Logs verbeux
    LOG_LEVEL = 'DEBUG'
    
    # Backup désactivé en dev
    BACKUP_ENABLED = False


class ProductionConfig(Config):
    """Configuration production"""
    
    DEBUG = False
    TESTING = False
    
    # Secret obligatoire en production
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY and os.getenv('FLASK_ENV') == 'production':
        raise ValueError("SECRET_KEY must be set in production!")
    
    # HTTPS forcé
    FORCE_HTTPS = True
    SESSION_COOKIE_SECURE = True
    
    # Rate limiting strict
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    
    # Logs en production
    LOG_LEVEL = 'WARNING'
    
    # Backup quotidien actif
    BACKUP_ENABLED = True


class TestingConfig(Config):
    """Configuration tests"""
    
    TESTING = True
    DEBUG = True
    
    # Désactive CSRF pour les tests
    WTF_CSRF_ENABLED = False
    
    # Session test
    SESSION_COOKIE_SECURE = False
    
    # Données de test
    DATA_DIR = Config.BASE_DIR / 'data_test'
    
    # Pas de rate limiting en test
    RATELIMIT_ENABLED = False
    
    # Pas de backup en test
    BACKUP_ENABLED = False


# Sélection de la config selon l'environnement
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config(env: str = None) -> Config:
    """
    Récupère la configuration selon l'environnement
    
    Args:
        env: Environnement (development, production, testing)
        
    Returns:
        Configuration appropriée
    """
    if env is None:
        env = os.getenv('FLASK_ENV', 'development')
    
    return config_map.get(env, DevelopmentConfig)
