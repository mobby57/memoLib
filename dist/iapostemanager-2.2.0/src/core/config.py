# -*- coding: utf-8 -*-
"""Configuration de l'application SecureVault"""

import os
from pathlib import Path

class Config:
    """Configuration de base"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(24)
    
    # Répertoire de l'application
    BASE_DIR = Path(__file__).parent.parent.parent
    APP_DIR = os.path.join(BASE_DIR, 'data')
    
    # Créer le répertoire data s'il n'existe pas
    os.makedirs(APP_DIR, exist_ok=True)
    
    # Sécurité
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # PBKDF2
    PBKDF2_ITERATIONS = 600000
    SALT_LENGTH = 32
    
    # Limites
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max
    
    # CORS
    CORS_ORIGINS = ['http://localhost:5000', 'http://127.0.0.1:5000']

class DevelopmentConfig(Config):
    """Configuration de développement"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Configuration de production"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
