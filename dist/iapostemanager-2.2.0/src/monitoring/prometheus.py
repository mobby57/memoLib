"""Prometheus metrics"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from flask import Response
import time

# Metrics
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')
active_users = Gauge('active_users', 'Number of active users')
emails_sent = Counter('emails_sent_total', 'Total emails sent', ['status'])
ai_generations = Counter('ai_generations_total', 'Total AI generations')

def track_request(f):
    """Decorator to track request metrics"""
    def wrapper(*args, **kwargs):
        start = time.time()
        try:
            response = f(*args, **kwargs)
            status = response.status_code if hasattr(response, 'status_code') else 200
            request_count.labels(method='GET', endpoint=f.__name__, status=status).inc()
            return response
        finally:
            request_duration.observe(time.time() - start)
    return wrapper

def metrics_endpoint():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), mimetype='text/plain')
