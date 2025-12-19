"""Logging configuration"""
import logging
import sys
from logging.handlers import RotatingFileHandler
import os

def setup_logging(app):
    """Configure structured logging"""
    
    # Create logs directory
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # File handler
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, 'app.log'),
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s [%(name)s] %(message)s'
    ))
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(
        '%(levelname)s: %(message)s'
    ))
    
    # Configure app logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.INFO)
    
    return app.logger
