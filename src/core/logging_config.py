"""Configuration du logging"""
import logging
import os
from datetime import datetime

def setup_logging(app=None):
    """Configure le système de logging"""
    
    # Créer le dossier logs s'il n'existe pas
    logs_dir = "logs"
    os.makedirs(logs_dir, exist_ok=True)
    
    # Configuration du logger principal
    logger = logging.getLogger('iapostemanager')
    logger.setLevel(logging.INFO)
    
    # Éviter les doublons de handlers
    if logger.handlers:
        return logger
    
    # Handler pour fichier
    log_file = os.path.join(logs_dir, 'app.log')
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    
    # Handler pour console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Format des logs
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Ajouter les handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # Configuration Flask si fournie
    if app:
        app.logger.handlers = logger.handlers
        app.logger.setLevel(logging.INFO)
    
    return logger