"""Limiteur de taux simple"""
import time
from collections import defaultdict, deque

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(deque)
        self.limits = {
            'api': (100, 3600),  # 100 requêtes par heure
            'email': (50, 3600),  # 50 emails par heure
            'ai': (20, 3600)      # 20 générations IA par heure
        }
    
    def is_allowed(self, key, identifier='default'):
        """Vérifie si la requête est autorisée"""
        if key not in self.limits:
            return True
        
        max_requests, window = self.limits[key]
        now = time.time()
        
        # Nettoyer les anciennes requêtes
        request_times = self.requests[f"{key}:{identifier}"]
        while request_times and request_times[0] <= now - window:
            request_times.popleft()
        
        # Vérifier la limite
        if len(request_times) >= max_requests:
            return False
        
        # Ajouter la requête actuelle
        request_times.append(now)
        return True
    
    def limit(self, key):
        """Décorateur pour limiter les requêtes"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                if not self.is_allowed(key):
                    from flask import jsonify
                    return jsonify({'error': 'Trop de requêtes'}), 429
                return func(*args, **kwargs)
            wrapper.__name__ = func.__name__
            return wrapper
        return decorator

# Instance globale
rate_limiter = RateLimiter()