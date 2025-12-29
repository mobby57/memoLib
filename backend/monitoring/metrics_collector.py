"""
Module MetricsCollector - Monitoring et observabilité complète
Propriété: MS CONSEILS - Sarra Boudjellal
Version: 2.3 Production Ready
"""

from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest, Info
import time
import psutil
import logging
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import threading
import requests
from pathlib import Path

@dataclass
class AlertRule:
    """Structure d'une règle d'alerte"""
    name: str
    condition: str
    threshold: float
    duration: int
    severity: str
    message: str
    enabled: bool = True

class MetricsCollector:
    """Collecteur de métriques Prometheus avec alertes intelligentes"""
    
    def __init__(self):
        self.registry = CollectorRegistry()
        self.logger = self._setup_logger()
        self._setup_metrics()
        self.alert_rules = self._load_alert_rules()
        self.alert_history = []
        self._monitoring_active = False
    
    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger("metrics_collector")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def _setup_metrics(self):
        """Initialise toutes les métriques Prometheus"""
        
        # Métriques applicatives
        self.workspace_created = Counter(
            'workspace_created_total',
            'Nombre total de workspaces créés',
            ['client_id', 'priority', 'category'],
            registry=self.registry
        )
        
        self.email_analysis_duration = Histogram(
            'email_analysis_duration_seconds',
            'Durée d\'analyse des emails',
            ['analysis_type', 'success', 'model'],
            registry=self.registry
        )
        
        self.ai_api_calls = Counter(
            'ai_api_calls_total',
            'Appels API IA',
            ['provider', 'model', 'status', 'client_id'],
            registry=self.registry
        )
        
        self.active_workspaces = Gauge(
            'active_workspaces_count',
            'Nombre de workspaces actifs',
            ['status', 'priority'],
            registry=self.registry
        )
        
        self.form_submissions = Counter(
            'form_submissions_total',
            'Soumissions de formulaires',
            ['client_id', 'form_type', 'success'],
            registry=self.registry
        )
        
        self.security_events = Counter(
            'security_events_total',
            'Événements de sécurité',
            ['event_type', 'severity', 'client_id'],
            registry=self.registry
        )
        
        # Métriques système
        self.cpu_usage = Gauge(
            'system_cpu_usage_percent',
            'Utilisation CPU système',
            registry=self.registry
        )
        
        self.memory_usage = Gauge(
            'system_memory_usage_bytes',
            'Utilisation mémoire système',
            registry=self.registry
        )
        
        self.disk_usage = Gauge(
            'system_disk_usage_percent',
            'Utilisation disque système',
            ['mount_point'],
            registry=self.registry
        )
        
        self.database_connections = Gauge(
            'database_connections_active',
            'Connexions base de données actives',
            ['database'],
            registry=self.registry
        )
        
        self.http_requests = Counter(
            'http_requests_total',
            'Requêtes HTTP totales',
            ['method', 'endpoint', 'status_code'],
            registry=self.registry
        )
        
        self.http_request_duration = Histogram(
            'http_request_duration_seconds',
            'Durée des requêtes HTTP',
            ['method', 'endpoint'],
            registry=self.registry
        )
        
        # Métriques business
        self.client_satisfaction = Gauge(
            'client_satisfaction_score',
            'Score de satisfaction client',
            ['client_id'],
            registry=self.registry
        )
        
        self.response_time_sla = Histogram(
            'response_time_sla_seconds',
            'Temps de réponse SLA',
            ['priority', 'client_id'],
            registry=self.registry
        )
        
        self.error_rate = Gauge(
            'error_rate_percent',
            'Taux d\'erreur',
            ['service', 'client_id'],
            registry=self.registry
        )
        
        # Informations système
        self.app_info = Info(
            'app_info',
            'Informations sur l\'application',
            registry=self.registry
        )
        
        self.app_info.info({
            'version': '2.3',
            'name': 'iaPosteManager',
            'owner': 'MS CONSEILS',
            'director': 'Sarra Boudjellal'
        })
    
    def record_workspace_creation(self, client_id: str, priority: str, category: str):
        """Enregistre la création d'un workspace"""
        self.workspace_created.labels(
            client_id=client_id, 
            priority=priority, 
            category=category
        ).inc()
        
        self.logger.info(f"Workspace créé: client={client_id}, priority={priority}")
    
    def record_email_analysis(self, analysis_type: str, duration: float, 
                            success: bool, model: str = "gpt-4"):
        """Enregistre une analyse d'email"""
        status = "success" if success else "error"
        self.email_analysis_duration.labels(
            analysis_type=analysis_type,
            success=status,
            model=model
        ).observe(duration)
        
        if duration > 5.0:  # Alerte si > 5 secondes
            self.logger.warning(f"Analyse lente: {duration:.2f}s pour {analysis_type}")
    
    def record_ai_api_call(self, provider: str, model: str, status: str, client_id: str):
        """Enregistre un appel API IA"""
        self.ai_api_calls.labels(
            provider=provider,
            model=model,
            status=status,
            client_id=client_id
        ).inc()
    
    def record_form_submission(self, client_id: str, form_type: str, success: bool):
        """Enregistre une soumission de formulaire"""
        status = "success" if success else "error"
        self.form_submissions.labels(
            client_id=client_id,
            form_type=form_type,
            success=status
        ).inc()
    
    def record_security_event(self, event_type: str, severity: str, client_id: str):
        """Enregistre un événement de sécurité"""
        self.security_events.labels(
            event_type=event_type,
            severity=severity,
            client_id=client_id
        ).inc()
        
        if severity in ["high", "critical"]:
            self.logger.error(f"Événement sécurité {severity}: {event_type}")
    
    def record_http_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Enregistre une requête HTTP"""
        self.http_requests.labels(
            method=method,
            endpoint=endpoint,
            status_code=str(status_code)
        ).inc()
        
        self.http_request_duration.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
    
    def update_system_metrics(self):
        """Met à jour les métriques système"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            self.cpu_usage.set(cpu_percent)
            
            # Mémoire
            memory = psutil.virtual_memory()
            self.memory_usage.set(memory.used)
            
            # Disque
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    usage_percent = (usage.used / usage.total) * 100
                    self.disk_usage.labels(mount_point=partition.mountpoint).set(usage_percent)
                except PermissionError:
                    continue
            
            # Connexions réseau (approximation pour DB)
            connections = len(psutil.net_connections())
            self.database_connections.labels(database="postgresql").set(connections)
            
        except Exception as e:
            self.logger.error(f"Erreur mise à jour métriques système: {e}")
    
    def update_business_metrics(self, client_metrics: Dict[str, Any]):
        """Met à jour les métriques business"""
        for client_id, metrics in client_metrics.items():
            if 'satisfaction_score' in metrics:
                self.client_satisfaction.labels(client_id=client_id).set(
                    metrics['satisfaction_score']
                )
            
            if 'error_rate' in metrics:
                self.error_rate.labels(
                    service="email_processing",
                    client_id=client_id
                ).set(metrics['error_rate'])
    
    def get_metrics(self) -> str:
        """Retourne les métriques au format Prometheus"""
        self.update_system_metrics()
        return generate_latest(self.registry)
    
    def start_monitoring(self, interval: int = 30):
        """Démarre le monitoring en arrière-plan"""
        self._monitoring_active = True
        
        def monitoring_loop():
            while self._monitoring_active:
                try:
                    self.update_system_metrics()
                    self._check_alerts()
                    time.sleep(interval)
                except Exception as e:
                    self.logger.error(f"Erreur monitoring: {e}")
                    time.sleep(interval)
        
        monitoring_thread = threading.Thread(target=monitoring_loop, daemon=True)
        monitoring_thread.start()
        
        self.logger.info(f"Monitoring démarré (interval: {interval}s)")
    
    def stop_monitoring(self):
        """Arrête le monitoring"""
        self._monitoring_active = False
        self.logger.info("Monitoring arrêté")
    
    def _load_alert_rules(self) -> List[AlertRule]:
        """Charge les règles d'alerte"""
        return [
            AlertRule(
                name="high_cpu_usage",
                condition="cpu_usage > threshold",
                threshold=80.0,
                duration=300,  # 5 minutes
                severity="warning",
                message="Utilisation CPU élevée: {value}%"
            ),
            AlertRule(
                name="high_memory_usage",
                condition="memory_usage > threshold",
                threshold=85.0,
                duration=300,
                severity="warning",
                message="Utilisation mémoire élevée: {value}%"
            ),
            AlertRule(
                name="high_error_rate",
                condition="error_rate > threshold",
                threshold=5.0,
                duration=60,
                severity="critical",
                message="Taux d'erreur élevé: {value}%"
            ),
            AlertRule(
                name="slow_response_time",
                condition="avg_response_time > threshold",
                threshold=2.0,
                duration=180,
                severity="warning",
                message="Temps de réponse lent: {value}s"
            ),
            AlertRule(
                name="disk_space_low",
                condition="disk_usage > threshold",
                threshold=90.0,
                duration=60,
                severity="critical",
                message="Espace disque faible: {value}%"
            )
        ]
    
    def _check_alerts(self):
        """Vérifie les conditions d'alerte"""
        current_metrics = self._get_current_metrics()
        
        for rule in self.alert_rules:
            if not rule.enabled:
                continue
            
            try:
                if self._evaluate_alert_condition(rule, current_metrics):
                    self._trigger_alert(rule, current_metrics)
            except Exception as e:
                self.logger.error(f"Erreur évaluation alerte {rule.name}: {e}")
    
    def _get_current_metrics(self) -> Dict[str, float]:
        """Récupère les métriques actuelles"""
        return {
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": max([
                psutil.disk_usage(p.mountpoint).percent 
                for p in psutil.disk_partitions() 
                if p.fstype
            ], default=0),
            "error_rate": 0.0,  # À calculer depuis les métriques
            "avg_response_time": 0.0  # À calculer depuis les métriques
        }
    
    def _evaluate_alert_condition(self, rule: AlertRule, metrics: Dict[str, float]) -> bool:
        """Évalue une condition d'alerte"""
        if rule.name == "high_cpu_usage":
            return metrics.get("cpu_usage", 0) > rule.threshold
        elif rule.name == "high_memory_usage":
            return metrics.get("memory_usage", 0) > rule.threshold
        elif rule.name == "disk_space_low":
            return metrics.get("disk_usage", 0) > rule.threshold
        elif rule.name == "high_error_rate":
            return metrics.get("error_rate", 0) > rule.threshold
        elif rule.name == "slow_response_time":
            return metrics.get("avg_response_time", 0) > rule.threshold
        
        return False
    
    def _trigger_alert(self, rule: AlertRule, metrics: Dict[str, float]):
        """Déclenche une alerte"""
        alert = {
            "timestamp": datetime.utcnow().isoformat(),
            "rule_name": rule.name,
            "severity": rule.severity,
            "message": rule.message.format(
                value=metrics.get(rule.name.split("_")[1], 0)
            ),
            "metrics": metrics
        }
        
        self.alert_history.append(alert)
        
        # Log selon la sévérité
        if rule.severity == "critical":
            self.logger.error(f"ALERTE CRITIQUE: {alert['message']}")
        elif rule.severity == "warning":
            self.logger.warning(f"ALERTE: {alert['message']}")
        else:
            self.logger.info(f"INFO: {alert['message']}")
        
        # Envoyer notification (webhook, email, etc.)
        self._send_alert_notification(alert)
    
    def _send_alert_notification(self, alert: Dict):
        """Envoie une notification d'alerte"""
        try:
            # Exemple d'envoi vers webhook Slack/Teams
            webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
            
            payload = {
                "text": f"🚨 {alert['severity'].upper()}: {alert['message']}",
                "attachments": [
                    {
                        "color": "danger" if alert['severity'] == "critical" else "warning",
                        "fields": [
                            {
                                "title": "Timestamp",
                                "value": alert['timestamp'],
                                "short": True
                            },
                            {
                                "title": "Rule",
                                "value": alert['rule_name'],
                                "short": True
                            }
                        ]
                    }
                ]
            }
            
            # Décommenter pour activer les notifications
            # requests.post(webhook_url, json=payload, timeout=10)
            
        except Exception as e:
            self.logger.error(f"Erreur envoi notification: {e}")

class AlertManager:
    """Gestionnaire d'alertes avancé"""
    
    def __init__(self, webhook_url: str = None):
        self.webhook_url = webhook_url
        self.logger = logging.getLogger("alert_manager")
        self.active_alerts = {}
        self.notification_channels = []
    
    def add_notification_channel(self, channel_type: str, config: Dict):
        """Ajoute un canal de notification"""
        self.notification_channels.append({
            "type": channel_type,
            "config": config,
            "enabled": True
        })
    
    async def send_alert(self, alert: Dict):
        """Envoie une alerte via tous les canaux configurés"""
        for channel in self.notification_channels:
            if not channel["enabled"]:
                continue
            
            try:
                if channel["type"] == "slack":
                    await self._send_slack_alert(alert, channel["config"])
                elif channel["type"] == "email":
                    await self._send_email_alert(alert, channel["config"])
                elif channel["type"] == "webhook":
                    await self._send_webhook_alert(alert, channel["config"])
            except Exception as e:
                self.logger.error(f"Erreur envoi alerte {channel['type']}: {e}")
    
    async def _send_slack_alert(self, alert: Dict, config: Dict):
        """Envoie alerte vers Slack"""
        payload = {
            "text": f"🚨 {alert['severity'].upper()}: {alert['message']}",
            "channel": config.get("channel", "#alerts"),
            "username": "IA Poste Manager",
            "icon_emoji": ":warning:"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(config["webhook_url"], json=payload) as response:
                if response.status != 200:
                    raise Exception(f"Slack API error: {response.status}")
    
    async def _send_email_alert(self, alert: Dict, config: Dict):
        """Envoie alerte par email"""
        # Implémentation d'envoi d'email
        pass
    
    async def _send_webhook_alert(self, alert: Dict, config: Dict):
        """Envoie alerte vers webhook générique"""
        async with aiohttp.ClientSession() as session:
            async with session.post(config["url"], json=alert) as response:
                if response.status not in [200, 201, 202]:
                    raise Exception(f"Webhook error: {response.status}")

class PerformanceMonitor:
    """Moniteur de performance applicative"""
    
    def __init__(self):
        self.metrics = {}
        self.benchmarks = {
            "workspace_creation": {"target": 1.0, "max": 3.0},
            "email_analysis": {"target": 2.0, "max": 5.0},
            "form_generation": {"target": 0.5, "max": 2.0},
            "ai_response": {"target": 3.0, "max": 10.0}
        }
    
    def measure_performance(self, operation: str):
        """Décorateur pour mesurer les performances"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time
                    self._record_performance(operation, duration, True)
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    self._record_performance(operation, duration, False)
                    raise
            return wrapper
        return decorator
    
    def _record_performance(self, operation: str, duration: float, success: bool):
        """Enregistre une mesure de performance"""
        if operation not in self.metrics:
            self.metrics[operation] = []
        
        self.metrics[operation].append({
            "duration": duration,
            "success": success,
            "timestamp": datetime.utcnow()
        })
        
        # Garder seulement les 1000 dernières mesures
        if len(self.metrics[operation]) > 1000:
            self.metrics[operation] = self.metrics[operation][-1000:]
        
        # Vérifier les seuils
        benchmark = self.benchmarks.get(operation)
        if benchmark and duration > benchmark["max"]:
            logging.getLogger("performance").warning(
                f"Performance dégradée pour {operation}: {duration:.2f}s > {benchmark['max']}s"
            )
    
    def get_performance_report(self) -> Dict:
        """Génère un rapport de performance"""
        report = {}
        
        for operation, measurements in self.metrics.items():
            if not measurements:
                continue
            
            recent_measurements = [
                m for m in measurements 
                if m["timestamp"] > datetime.utcnow() - timedelta(hours=1)
            ]
            
            if recent_measurements:
                durations = [m["duration"] for m in recent_measurements]
                success_rate = sum(1 for m in recent_measurements if m["success"]) / len(recent_measurements)
                
                report[operation] = {
                    "avg_duration": sum(durations) / len(durations),
                    "max_duration": max(durations),
                    "min_duration": min(durations),
                    "success_rate": success_rate,
                    "total_calls": len(recent_measurements),
                    "benchmark": self.benchmarks.get(operation, {})
                }
        
        return report

# Configuration Grafana Dashboard
GRAFANA_DASHBOARD_CONFIG = {
    "dashboard": {
        "id": None,
        "title": "IA Poste Manager - Monitoring v2.3",
        "tags": ["iapostemanager", "msconseils"],
        "timezone": "Europe/Paris",
        "panels": [
            {
                "id": 1,
                "title": "Workspaces Créés",
                "type": "stat",
                "targets": [
                    {
                        "expr": "rate(workspace_created_total[5m])",
                        "legendFormat": "{{client_id}} - {{priority}}"
                    }
                ],
                "fieldConfig": {
                    "defaults": {
                        "color": {"mode": "palette-classic"},
                        "unit": "reqps"
                    }
                }
            },
            {
                "id": 2,
                "title": "Temps d'Analyse Email",
                "type": "graph",
                "targets": [
                    {
                        "expr": "histogram_quantile(0.95, email_analysis_duration_seconds)",
                        "legendFormat": "95th percentile"
                    },
                    {
                        "expr": "histogram_quantile(0.50, email_analysis_duration_seconds)",
                        "legendFormat": "Médiane"
                    }
                ]
            },
            {
                "id": 3,
                "title": "Utilisation Système",
                "type": "graph",
                "targets": [
                    {
                        "expr": "system_cpu_usage_percent",
                        "legendFormat": "CPU %"
                    },
                    {
                        "expr": "system_memory_usage_bytes / 1024 / 1024 / 1024",
                        "legendFormat": "Memory GB"
                    }
                ]
            },
            {
                "id": 4,
                "title": "Appels API IA",
                "type": "table",
                "targets": [
                    {
                        "expr": "sum by (provider, model) (rate(ai_api_calls_total[5m]))",
                        "format": "table"
                    }
                ]
            },
            {
                "id": 5,
                "title": "Événements de Sécurité",
                "type": "logs",
                "targets": [
                    {
                        "expr": "sum by (severity) (rate(security_events_total[1h]))",
                        "legendFormat": "{{severity}}"
                    }
                ]
            }
        ],
        "time": {
            "from": "now-1h",
            "to": "now"
        },
        "refresh": "30s"
    }
}