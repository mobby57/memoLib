"""
Service de logging centralisé
"""
import logging
import json
import os
from datetime import datetime
from typing import Dict, Any

class LoggerService:
    """Service de logging centralisé pour IA Poste Manager"""
    
    def __init__(self):
        self.setup_logging()
        
    def setup_logging(self):
        """Configure le système de logging"""
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f"{log_dir}/app.log"),
                logging.StreamHandler()
            ]
        )
        
    def log_service_event(self, service_name: str, event_type: str, details: Dict[str, Any]):
        """Log un événement de service"""
        logger = logging.getLogger(service_name)
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "service": service_name,
            "event_type": event_type,
            "details": details
        }
        
        logger.info(json.dumps(log_entry, ensure_ascii=False))
        
    def log_error(self, service_name: str, error: str, context: Dict[str, Any] = None):
        """Log une erreur"""
        logger = logging.getLogger(service_name)
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "service": service_name,
            "error": error,
            "context": context or {}
        }
        
        logger.error(json.dumps(log_entry, ensure_ascii=False))