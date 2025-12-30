"""
Système d'audit trail pour conformité juridique
Traçabilité complète des actions pour cabinets d'avocats (RGPD + déontologie)
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from functools import wraps
from flask import request, session
from pythonjsonlogger import jsonlogger


class AuditLogger:
    """Logger d'audit pour traçabilité juridique"""
    
    def __init__(self, log_dir: str = 'logs/audit'):
        """
        Initialise le système d'audit
        
        Args:
            log_dir: Répertoire des logs d'audit
        """
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Logger structuré JSON
        self.logger = logging.getLogger('audit')
        self.logger.setLevel(logging.INFO)
        
        # Handler fichier avec rotation quotidienne
        log_file = self.log_dir / f'audit_{datetime.now().strftime("%Y%m")}.jsonl'
        handler = logging.FileHandler(log_file, encoding='utf-8')
        
        # Format JSON structuré
        formatter = jsonlogger.JsonFormatter(
            '%(timestamp)s %(level)s %(user)s %(action)s %(resource)s %(details)s %(ip)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
    
    def log(self, 
            action: str, 
            resource: str, 
            details: Dict[str, Any] = None,
            user: str = None,
            level: str = 'INFO',
            ip_address: str = None):
        """
        Enregistre une action dans l'audit trail
        
        Args:
            action: Type d'action (CREATE, READ, UPDATE, DELETE, EXPORT, LOGIN, etc.)
            resource: Ressource concernée (dossier, facture, client, etc.)
            details: Détails supplémentaires
            user: Utilisateur (auto-détecté si None)
            level: Niveau de log (INFO, WARNING, ERROR)
            ip_address: Adresse IP (auto-détectée si None)
        """
        # Récupération auto des infos de session
        if user is None and session:
            user = session.get('user_id', 'anonymous')
        
        if ip_address is None and request:
            ip_address = request.remote_addr
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'level': level,
            'user': user or 'system',
            'action': action,
            'resource': resource,
            'details': details or {},
            'ip': ip_address or 'local'
        }
        
        # Enregistrement dans le fichier
        if level == 'ERROR':
            self.logger.error('', extra=log_entry)
        elif level == 'WARNING':
            self.logger.warning('', extra=log_entry)
        else:
            self.logger.info('', extra=log_entry)
    
    def log_access(self, resource_type: str, resource_id: str, action: str = 'READ'):
        """
        Log accès à une ressource (dossier, client)
        
        Args:
            resource_type: Type de ressource (dossier, client, facture)
            resource_id: Identifiant de la ressource
            action: Action (READ, UPDATE, DELETE)
        """
        self.log(
            action=action,
            resource=f'{resource_type}/{resource_id}',
            details={'resource_type': resource_type, 'resource_id': resource_id}
        )
    
    def log_data_modification(self, resource: str, old_value: Any, new_value: Any, field: str = None):
        """
        Log modification de données
        
        Args:
            resource: Ressource modifiée
            old_value: Ancienne valeur
            new_value: Nouvelle valeur
            field: Champ modifié
        """
        self.log(
            action='UPDATE',
            resource=resource,
            details={
                'field': field,
                'old_value': str(old_value)[:100],  # Tronqué pour éviter logs trop longs
                'new_value': str(new_value)[:100]
            }
        )
    
    def log_export(self, export_type: str, resource: str, format: str = 'PDF'):
        """
        Log export de données (factures, rapports)
        
        Args:
            export_type: Type d'export (facture, rapport, archive)
            resource: Ressource exportée
            format: Format (PDF, Excel, Word)
        """
        self.log(
            action='EXPORT',
            resource=resource,
            details={'export_type': export_type, 'format': format},
            level='WARNING'  # Export = données sensibles
        )
    
    def log_auth(self, action: str, user: str, success: bool = True):
        """
        Log événements d'authentification
        
        Args:
            action: LOGIN, LOGOUT, FAILED_LOGIN
            user: Utilisateur
            success: Succès/échec
        """
        self.log(
            action=action,
            resource='authentication',
            user=user,
            details={'success': success},
            level='WARNING' if not success else 'INFO'
        )
    
    def log_security_event(self, event: str, details: Dict[str, Any]):
        """
        Log événement de sécurité (tentative accès non autorisé, etc.)
        
        Args:
            event: Type d'événement de sécurité
            details: Détails de l'événement
        """
        self.log(
            action='SECURITY_EVENT',
            resource='security',
            details={'event': event, **details},
            level='ERROR'
        )
    
    def get_user_activity(self, user: str, days: int = 30) -> list:
        """
        Récupère l'activité d'un utilisateur
        
        Args:
            user: Utilisateur
            days: Nombre de jours à récupérer
            
        Returns:
            Liste des actions de l'utilisateur
        """
        activities = []
        
        # Lecture des fichiers de logs
        for log_file in sorted(self.log_dir.glob('audit_*.jsonl'), reverse=True):
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        if entry.get('user') == user:
                            activities.append(entry)
                    except json.JSONDecodeError:
                        continue
        
        return activities[:100]  # Limite à 100 entrées
    
    def get_resource_history(self, resource: str) -> list:
        """
        Récupère l'historique complet d'une ressource
        
        Args:
            resource: Ressource (ex: "dossier/2024-0001")
            
        Returns:
            Historique de la ressource
        """
        history = []
        
        for log_file in sorted(self.log_dir.glob('audit_*.jsonl'), reverse=True):
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        if entry.get('resource') == resource:
                            history.append(entry)
                    except json.JSONDecodeError:
                        continue
        
        return sorted(history, key=lambda x: x['timestamp'], reverse=True)


# Instance globale
audit_logger = AuditLogger()


def audit_action(action: str, resource_type: str):
    """
    Décorateur pour auditer automatiquement les actions
    
    Usage:
        @audit_action('CREATE', 'dossier')
        def create_dossier(data):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Exécution de la fonction
            result = func(*args, **kwargs)
            
            # Log de l'action
            resource_id = kwargs.get('id') or result.get('id') if isinstance(result, dict) else 'unknown'
            audit_logger.log(
                action=action,
                resource=f'{resource_type}/{resource_id}',
                details={'function': func.__name__, 'args': str(kwargs)}
            )
            
            return result
        return wrapper
    return decorator


def audit_read_access(resource_type: str):
    """
    Décorateur pour auditer les accès en lecture
    
    Usage:
        @audit_read_access('dossier')
        def get_dossier(id):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            resource_id = kwargs.get('id') or (args[0] if args else 'unknown')
            
            # Log avant l'accès
            audit_logger.log_access(resource_type, str(resource_id), 'READ')
            
            # Exécution
            return func(*args, **kwargs)
        return wrapper
    return decorator
