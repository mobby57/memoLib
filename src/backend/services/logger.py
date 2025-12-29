"""
Logger Service for IA Poste Manager

Handles structured logging, monitoring, and performance tracking
"""

import logging
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import asyncio
from pathlib import Path

# Configuration du logging structuré
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


class LogLevel(str, Enum):
    """Niveaux de log"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class EventType(str, Enum):
    """Types d'événements"""
    WORKSPACE_CREATED = "workspace_created"
    WORKSPACE_PROCESSED = "workspace_processed"
    WORKSPACE_COMPLETED = "workspace_completed"
    WORKSPACE_ERROR = "workspace_error"
    AI_REQUEST = "ai_request"
    AI_RESPONSE = "ai_response"
    USER_ACTION = "user_action"
    SYSTEM_ERROR = "system_error"
    PERFORMANCE_METRIC = "performance_metric"


class LoggerService:
    """Service de logging et monitoring"""

    def __init__(self, log_dir: str = "logs", max_log_files: int = 30):
        self.log_dir = Path(log_dir)
        self.max_log_files = max_log_files
        
        # Créer le dossier de logs
        self.log_dir.mkdir(exist_ok=True)
        
        # Métriques en mémoire
        self.metrics = {
            'events_count': {},
            'performance_data': [],
            'error_count': 0,
            'last_cleanup': datetime.utcnow()
        }
        
        # Configuration des loggers
        self._setup_loggers()

    def _setup_loggers(self):
        """Configure les loggers spécialisés"""
        
        # Logger pour les événements workspace
        self.workspace_logger = logging.getLogger('workspace')
        workspace_handler = logging.FileHandler(
            self.log_dir / 'workspace.log',
            encoding='utf-8'
        )
        workspace_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        )
        self.workspace_logger.addHandler(workspace_handler)
        self.workspace_logger.setLevel(logging.INFO)
        
        # Logger pour les performances
        self.performance_logger = logging.getLogger('performance')
        performance_handler = logging.FileHandler(
            self.log_dir / 'performance.log',
            encoding='utf-8'
        )
        performance_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(message)s')
        )
        self.performance_logger.addHandler(performance_handler)
        self.performance_logger.setLevel(logging.INFO)
        
        # Logger pour les erreurs
        self.error_logger = logging.getLogger('errors')
        error_handler = logging.FileHandler(
            self.log_dir / 'errors.log',
            encoding='utf-8'
        )
        error_handler.setFormatter(
            logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        )
        self.error_logger.addHandler(error_handler)
        self.error_logger.setLevel(logging.WARNING)

    def log_workspace_event(
        self,
        workspace_id: str,
        event_type: str,
        details: Dict[str, Any] = None,
        user_id: str = None
    ) -> None:
        """
        Enregistre un événement workspace
        
        Args:
            workspace_id: ID du workspace
            event_type: Type d'événement
            details: Détails supplémentaires
            user_id: ID utilisateur (optionnel)
        """
        try:
            event_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'workspace_id': workspace_id,
                'event_type': event_type,
                'user_id': user_id,
                'details': details or {}
            }
            
            # Log structuré
            log_message = json.dumps(event_data, ensure_ascii=False)
            self.workspace_logger.info(log_message)
            
            # Mettre à jour les métriques
            if event_type not in self.metrics['events_count']:
                self.metrics['events_count'][event_type] = 0
            self.metrics['events_count'][event_type] += 1
            
            # Log spécial pour les erreurs
            if 'error' in event_type.lower():
                self.error_logger.error(f"Workspace {workspace_id}: {event_data}")
                self.metrics['error_count'] += 1
            
        except Exception as e:
            logger.error(f"Error logging workspace event: {str(e)}")

    def log_performance(
        self,
        operation: str,
        duration: float,
        details: Dict[str, Any] = None,
        user_id: str = None
    ) -> None:
        """
        Enregistre une métrique de performance
        
        Args:
            operation: Nom de l'opération
            duration: Durée en secondes
            details: Détails supplémentaires
            user_id: ID utilisateur (optionnel)
        """
        try:
            performance_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'operation': operation,
                'duration_seconds': duration,
                'user_id': user_id,
                'details': details or {}
            }
            
            # Log structuré
            log_message = json.dumps(performance_data, ensure_ascii=False)
            self.performance_logger.info(log_message)
            
            # Stocker en mémoire pour les statistiques
            self.metrics['performance_data'].append({
                'operation': operation,
                'duration': duration,
                'timestamp': datetime.utcnow()
            })
            
            # Nettoyer les anciennes données (garder 1000 dernières)
            if len(self.metrics['performance_data']) > 1000:
                self.metrics['performance_data'] = self.metrics['performance_data'][-1000:]
            
        except Exception as e:
            logger.error(f"Error logging performance: {str(e)}")

    async def log_ai_interaction(
        self,
        provider: str,
        model: str,
        tokens_used: int,
        duration: float,
        success: bool,
        error_message: str = None
    ) -> None:
        """
        Enregistre une interaction IA
        
        Args:
            provider: Fournisseur IA (OpenAI, Ollama, etc.)
            model: Modèle utilisé
            tokens_used: Nombre de tokens utilisés
            duration: Durée de l'interaction
            success: Succès de l'interaction
            error_message: Message d'erreur (si échec)
        """
        try:
            ai_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'provider': provider,
                'model': model,
                'tokens_used': tokens_used,
                'duration_seconds': duration,
                'success': success,
                'error_message': error_message
            }
            
            # Log dans le fichier performance
            log_message = json.dumps(ai_data, ensure_ascii=False)
            self.performance_logger.info(f"AI_INTERACTION: {log_message}")
            
            # Log d'erreur si nécessaire
            if not success and error_message:
                self.error_logger.error(f"AI interaction failed: {ai_data}")
            
        except Exception as e:
            logger.error(f"Error logging AI interaction: {str(e)}")

    def log_user_action(
        self,
        user_id: str,
        action: str,
        resource: str = None,
        details: Dict[str, Any] = None,
        ip_address: str = None
    ) -> None:
        """
        Enregistre une action utilisateur

        Args:
            user_id: ID de l'utilisateur
            action: Action effectuée
            resource: Ressource concernée
            details: Détails supplémentaires
            ip_address: Adresse IP de l'utilisateur
        """
        try:
            user_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'action': action,
                'resource': resource,
                'ip_address': ip_address,
                'details': details or {}
            }

            # Log structuré
            log_message = json.dumps(user_data, ensure_ascii=False)
            self.workspace_logger.info(f"USER_ACTION: {log_message}")

        except Exception as e:
            logger.error(f"Error logging user action: {str(e)}")

    async def log_event(
        self,
        event_type: str,
        details: Dict[str, Any] = None,
        user_id: str = None,
        resource: str = None
    ) -> None:
        """
        Enregistre un événement générique

        Args:
            event_type: Type d'événement
            details: Détails supplémentaires
            user_id: ID utilisateur (optionnel)
            resource: Ressource concernée (optionnel)
        """
        try:
            event_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': event_type,
                'user_id': user_id,
                'resource': resource,
                'details': details or {}
            }

            # Log structuré
            log_message = json.dumps(event_data, ensure_ascii=False)
            self.workspace_logger.info(f"EVENT: {log_message}")

            # Mettre à jour les métriques
            if event_type not in self.metrics['events_count']:
                self.metrics['events_count'][event_type] = 0
            self.metrics['events_count'][event_type] += 1

            # Log spécial pour les erreurs
            if 'error' in event_type.lower():
                self.error_logger.error(f"Event {event_type}: {event_data}")
                self.metrics['error_count'] += 1

        except Exception as e:
            logger.error(f"Error logging event: {str(e)}")

    def log_error(
        self,
        event_type: str,
        message: str,
        details: Dict[str, Any] = None,
        user_id: str = None,
        resource: str = None
    ) -> None:
        """
        Enregistre une erreur

        Args:
            event_type: Type d'événement d'erreur
            message: Message d'erreur
            details: Détails supplémentaires
            user_id: ID utilisateur (optionnel)
            resource: Ressource concernée (optionnel)
        """
        try:
            error_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': event_type,
                'message': message,
                'user_id': user_id,
                'resource': resource,
                'details': details or {}
            }

            # Log structuré
            log_message = json.dumps(error_data, ensure_ascii=False)
            self.error_logger.error(f"ERROR: {log_message}")

            # Mettre à jour les métriques
            self.metrics['error_count'] += 1

        except Exception as e:
            logger.error(f"Error logging error event: {str(e)}")

    def log_service_event(
        self,
        service_name: str,
        event_type: str,
        details: Dict[str, Any] = None,
        user_id: str = None,
        resource: str = None
    ) -> None:
        """
        Enregistre un événement de service

        Args:
            service_name: Nom du service
            event_type: Type d'événement
            details: Détails supplémentaires
            user_id: ID utilisateur (optionnel)
            resource: Ressource concernée (optionnel)
        """
        try:
            event_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'service_name': service_name,
                'event_type': event_type,
                'user_id': user_id,
                'resource': resource,
                'details': details or {}
            }

            # Log structuré
            log_message = json.dumps(event_data, ensure_ascii=False)
            self.workspace_logger.info(f"SERVICE_EVENT: {log_message}")

            # Mettre à jour les métriques
            if event_type not in self.metrics['events_count']:
                self.metrics['events_count'][event_type] = 0
            self.metrics['events_count'][event_type] += 1

            # Log spécial pour les erreurs
            if 'error' in event_type.lower():
                self.error_logger.error(f"Service {service_name}: {event_data}")
                self.metrics['error_count'] += 1

        except Exception as e:
            logger.error(f"Error logging service event: {str(e)}")

    async def get_performance_stats(
        self,
        operation: str = None,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Récupère les statistiques de performance
        
        Args:
            operation: Opération spécifique (optionnel)
            hours: Nombre d'heures à analyser
            
        Returns:
            Statistiques de performance
        """
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            # Filtrer les données récentes
            recent_data = [
                d for d in self.metrics['performance_data']
                if d['timestamp'] > cutoff_time
            ]
            
            if operation:
                recent_data = [d for d in recent_data if d['operation'] == operation]
            
            if not recent_data:
                return {
                    'operation': operation,
                    'period_hours': hours,
                    'total_operations': 0,
                    'average_duration': 0,
                    'min_duration': 0,
                    'max_duration': 0
                }
            
            durations = [d['duration'] for d in recent_data]
            
            return {
                'operation': operation,
                'period_hours': hours,
                'total_operations': len(recent_data),
                'average_duration': sum(durations) / len(durations),
                'min_duration': min(durations),
                'max_duration': max(durations),
                'operations_per_hour': len(recent_data) / hours
            }
            
        except Exception as e:
            logger.error(f"Error getting performance stats: {str(e)}")
            return {}

    async def get_error_summary(self, hours: int = 24) -> Dict[str, Any]:
        """
        Récupère un résumé des erreurs

        Args:
            hours: Nombre d'heures à analyser

        Returns:
            Résumé des erreurs
        """
        try:
            # Lire le fichier d'erreurs
            error_file = self.log_dir / 'errors.log'
            if not error_file.exists():
                return {'total_errors': 0, 'error_types': {}}

            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            error_types = {}
            total_errors = 0

            with open(error_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        # Parser la ligne de log
                        if ' - ERROR - ' in line or ' - CRITICAL - ' in line:
                            timestamp_str = line.split(' - ')[0]
                            timestamp = datetime.fromisoformat(timestamp_str)

                            if timestamp > cutoff_time:
                                total_errors += 1

                                # Extraire le type d'erreur
                                if 'workspace' in line.lower():
                                    error_type = 'workspace_error'
                                elif 'ai' in line.lower():
                                    error_type = 'ai_error'
                                elif 'security' in line.lower():
                                    error_type = 'security_error'
                                else:
                                    error_type = 'general_error'

                                if error_type not in error_types:
                                    error_types[error_type] = 0
                                error_types[error_type] += 1

                    except Exception:
                        continue

            return {
                'period_hours': hours,
                'total_errors': total_errors,
                'error_types': error_types,
                'errors_per_hour': total_errors / hours
            }

        except Exception as e:
            logger.error(f"Error getting error summary: {str(e)}")
            return {'total_errors': 0, 'error_types': {}}

    async def cleanup_old_logs(self) -> None:
        """Nettoie les anciens fichiers de log"""
        try:
            # Nettoyer seulement une fois par jour
            if (datetime.utcnow() - self.metrics['last_cleanup']).days < 1:
                return
            
            cutoff_date = datetime.utcnow() - timedelta(days=self.max_log_files)
            
            for log_file in self.log_dir.glob('*.log'):
                try:
                    file_time = datetime.fromtimestamp(log_file.stat().st_mtime)
                    if file_time < cutoff_date:
                        log_file.unlink()
                        logger.info(f"Deleted old log file: {log_file}")
                except Exception as e:
                    logger.warning(f"Could not delete log file {log_file}: {str(e)}")
            
            self.metrics['last_cleanup'] = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Error cleaning up logs: {str(e)}")

    async def get_system_health(self) -> Dict[str, Any]:
        """
        Retourne l'état de santé du système
        
        Returns:
            Indicateurs de santé du système
        """
        try:
            # Statistiques des 24 dernières heures
            perf_stats = await self.get_performance_stats(hours=24)
            error_summary = await self.get_error_summary(hours=24)
            
            # Calculer le score de santé (0-100)
            health_score = 100
            
            # Pénalités pour les erreurs
            if error_summary['total_errors'] > 10:
                health_score -= min(error_summary['total_errors'] * 2, 50)
            
            # Pénalités pour les performances lentes
            if perf_stats.get('average_duration', 0) > 5.0:
                health_score -= 20
            
            health_score = max(health_score, 0)
            
            return {
                'health_score': health_score,
                'status': 'healthy' if health_score > 80 else 'degraded' if health_score > 50 else 'unhealthy',
                'performance_stats': perf_stats,
                'error_summary': error_summary,
                'events_count': self.metrics['events_count'],
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting system health: {str(e)}")
            return {
                'health_score': 0,
                'status': 'error',
                'error': str(e),
                'last_updated': datetime.utcnow().isoformat()
            }