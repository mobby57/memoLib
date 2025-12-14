"""Métriques Prometheus simples"""
import time
from collections import defaultdict, Counter
from datetime import datetime

class SimpleMetrics:
    def __init__(self):
        self.counters = defaultdict(int)
        self.histograms = defaultdict(list)
        self.gauges = defaultdict(float)
        self.start_time = time.time()
    
    def increment_counter(self, name, labels=None):
        """Incrémente un compteur"""
        key = f"{name}_{labels}" if labels else name
        self.counters[key] += 1
    
    def record_histogram(self, name, value, labels=None):
        """Enregistre une valeur dans un histogramme"""
        key = f"{name}_{labels}" if labels else name
        self.histograms[key].append(value)
        
        # Garder seulement les 1000 dernières valeurs
        if len(self.histograms[key]) > 1000:
            self.histograms[key] = self.histograms[key][-1000:]
    
    def set_gauge(self, name, value, labels=None):
        """Définit la valeur d'une jauge"""
        key = f"{name}_{labels}" if labels else name
        self.gauges[key] = value
    
    def get_metrics(self):
        """Retourne toutes les métriques au format texte"""
        lines = []
        
        # Compteurs
        for name, value in self.counters.items():
            lines.append(f"# TYPE {name} counter")
            lines.append(f"{name} {value}")
        
        # Jauges
        for name, value in self.gauges.items():
            lines.append(f"# TYPE {name} gauge")
            lines.append(f"{name} {value}")
        
        # Histogrammes (moyennes simples)
        for name, values in self.histograms.items():
            if values:
                avg = sum(values) / len(values)
                lines.append(f"# TYPE {name}_avg gauge")
                lines.append(f"{name}_avg {avg}")
                lines.append(f"# TYPE {name}_count counter")
                lines.append(f"{name}_count {len(values)}")
        
        # Métrique de temps de fonctionnement
        uptime = time.time() - self.start_time
        lines.append(f"# TYPE app_uptime_seconds gauge")
        lines.append(f"app_uptime_seconds {uptime}")
        
        return "\\n".join(lines)

# Instance globale
metrics = SimpleMetrics()

def track_request(func):
    """Décorateur pour tracker les requêtes"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            metrics.increment_counter('http_requests_total', 'success')
            return result
        except Exception as e:
            metrics.increment_counter('http_requests_total', 'error')
            raise
        finally:
            duration = time.time() - start_time
            metrics.record_histogram('http_request_duration_seconds', duration)
    
    wrapper.__name__ = func.__name__
    return wrapper

def metrics_endpoint():
    """Endpoint pour exposer les métriques"""
    return metrics.get_metrics(), 200, {'Content-Type': 'text/plain'}