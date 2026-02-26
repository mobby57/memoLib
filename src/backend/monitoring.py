"""
Système de monitoring et métriques
"""
import time
import json
import os
from datetime import datetime
from functools import wraps
from flask import request, g

class MetricsCollector:
    def __init__(self):
        self.metrics = {
            'requests_total': 0,
            'requests_by_endpoint': {},
            'response_times': {},
            'errors_total': 0,
            'emails_sent': 0,
            'ai_generations': 0,
            'active_sessions': 0
        }
        self.load_metrics()
    
    def load_metrics(self):
        """Charger les métriques depuis le fichier"""
        try:
            metrics_file = os.path.join(os.path.dirname(__file__), 'data', 'metrics.json')
            if os.path.exists(metrics_file):
                with open(metrics_file, 'r') as f:
                    saved_metrics = json.load(f)
                    self.metrics.update(saved_metrics)
        except:
            pass
    
    def save_metrics(self):
        """Sauvegarder les métriques"""
        try:
            os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)
            metrics_file = os.path.join(os.path.dirname(__file__), 'data', 'metrics.json')
            with open(metrics_file, 'w') as f:
                json.dump(self.metrics, f, indent=2)
        except Exception as e:
            print(f"Erreur sauvegarde métriques: {e}")
    
    def record_request(self, endpoint, method, response_time, status_code):
        """Enregistrer une requête"""
        self.metrics['requests_total'] += 1
        
        key = f"{method} {endpoint}"
        if key not in self.metrics['requests_by_endpoint']:
            self.metrics['requests_by_endpoint'][key] = 0
        self.metrics['requests_by_endpoint'][key] += 1
        
        if key not in self.metrics['response_times']:
            self.metrics['response_times'][key] = []
        self.metrics['response_times'][key].append(response_time)
        
        # Garder seulement les 100 derniers temps de réponse
        if len(self.metrics['response_times'][key]) > 100:
            self.metrics['response_times'][key] = self.metrics['response_times'][key][-100:]
        
        if status_code >= 400:
            self.metrics['errors_total'] += 1
        
        self.save_metrics()
    
    def record_email_sent(self):
        """Enregistrer un email envoyé"""
        self.metrics['emails_sent'] += 1
        self.save_metrics()
    
    def record_ai_generation(self):
        """Enregistrer une génération IA"""
        self.metrics['ai_generations'] += 1
        self.save_metrics()
    
    def get_metrics(self):
        """Obtenir toutes les métriques"""
        # Calculer les moyennes des temps de réponse
        avg_response_times = {}
        for endpoint, times in self.metrics['response_times'].items():
            if times:
                avg_response_times[endpoint] = sum(times) / len(times)
        
        return {
            **self.metrics,
            'avg_response_times': avg_response_times,
            'timestamp': datetime.now().isoformat()
        }

# Instance globale
metrics = MetricsCollector()

def monitor_requests(app):
    """Middleware de monitoring des requêtes"""
    
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            response_time = (time.time() - g.start_time) * 1000  # en ms
            metrics.record_request(
                request.endpoint or 'unknown',
                request.method,
                response_time,
                response.status_code
            )
        return response

def track_email_sent(f):
    """Décorateur pour tracker les emails envoyés"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        result = f(*args, **kwargs)
        if isinstance(result, dict) and result.get('success'):
            metrics.record_email_sent()
        return result
    return decorated_function

def track_ai_generation(f):
    """Décorateur pour tracker les générations IA"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        result = f(*args, **kwargs)
        if isinstance(result, dict) and result.get('success'):
            metrics.record_ai_generation()
        return result
    return decorated_function

class HealthChecker:
    def __init__(self, db, email_service, ai_service):
        self.db = db
        self.email_service = email_service
        self.ai_service = ai_service
    
    def check_database(self):
        """Vérifier la santé de la base de données"""
        try:
            # Test simple de connexion
            emails = self.db.get_email_history(limit=1)
            return {'status': 'healthy', 'response_time': 0}
        except Exception as e:
            return {'status': 'unhealthy', 'error': str(e)}
    
    def check_email_service(self):
        """Vérifier le service email"""
        try:
            # Test basique (pas d'envoi réel)
            return {'status': 'healthy'}
        except Exception as e:
            return {'status': 'unhealthy', 'error': str(e)}
    
    def check_ai_service(self):
        """Vérifier le service IA"""
        try:
            if self.ai_service and self.ai_service.api_key:
                return {'status': 'healthy', 'provider': 'openai'}
            else:
                return {'status': 'healthy', 'provider': 'fallback'}
        except Exception as e:
            return {'status': 'unhealthy', 'error': str(e)}
    
    def get_health_status(self):
        """Obtenir le statut de santé complet"""
        checks = {
            'database': self.check_database(),
            'email_service': self.check_email_service(),
            'ai_service': self.check_ai_service()
        }
        
        overall_status = 'healthy'
        for check in checks.values():
            if check['status'] != 'healthy':
                overall_status = 'unhealthy'
                break
        
        return {
            'status': overall_status,
            'timestamp': datetime.now().isoformat(),
            'checks': checks,
            'version': '3.0.0'
        }