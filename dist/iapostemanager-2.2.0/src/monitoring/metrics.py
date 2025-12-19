"""Métriques Prometheus"""
from prometheus_flask_exporter import PrometheusMetrics
from flask import request

class MetricsManager:
    def __init__(self, app=None):
        self.metrics = None
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.metrics = PrometheusMetrics(app)
        
        # Métriques custom
        self.email_counter = self.metrics.counter(
            'emails_sent_total', 'Total emails sent'
        )
        
        self.ai_counter = self.metrics.counter(
            'ai_generations_total', 'Total AI generations'
        )
    
    def track_email(self):
        if self.metrics:
            self.email_counter.inc()
    
    def track_ai_generation(self):
        if self.metrics:
            self.ai_counter.inc()