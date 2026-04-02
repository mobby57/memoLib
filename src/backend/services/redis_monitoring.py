"""
Redis Cloud Monitoring Service
Prometheus + Grafana pour IA CESEDA
"""
import requests
import os
from typing import Dict, Optional

class RedisCloudMonitoring:
    def __init__(self):
        self.prometheus_endpoint = os.getenv('REDIS_PROMETHEUS_ENDPOINT')
        self.enabled = bool(self.prometheus_endpoint)
    
    def get_metrics(self) -> Optional[Dict]:
        """Récupérer métriques Redis Cloud"""
        if not self.enabled:
            return None
        
        try:
            response = requests.get(
                f"https://{self.prometheus_endpoint}:8070/",
                timeout=10
            )
            return {"status": "connected", "metrics_available": True}
        except:
            return {"status": "disconnected", "metrics_available": False}
    
    def get_health_status(self) -> Dict:
        """Status santé Redis Cloud"""
        metrics = self.get_metrics()
        return {
            "monitoring_enabled": self.enabled,
            "prometheus_endpoint": self.prometheus_endpoint if self.enabled else None,
            "metrics_status": metrics.get("status", "unknown") if metrics else "unavailable"
        }

# Instance globale
redis_monitoring = RedisCloudMonitoring()