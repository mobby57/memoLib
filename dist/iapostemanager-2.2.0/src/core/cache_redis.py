"""Cache Redis intégré"""
import redis
import json
import logging
from functools import wraps

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self, redis_url='redis://localhost:6379/0'):
        try:
            self.redis = redis.from_url(redis_url, decode_responses=True)
            self.redis.ping()
            self.available = True
            logger.info("Redis connecté")
        except:
            self.redis = None
            self.available = False
            logger.warning("Redis non disponible")
    
    def get(self, key):
        """Récupérer une valeur"""
        if not self.available:
            return None
        try:
            value = self.redis.get(key)
            return json.loads(value) if value else None
        except:
            return None
    
    def set(self, key, value, timeout=300):
        """Stocker une valeur"""
        if not self.available:
            return False
        try:
            self.redis.setex(key, timeout, json.dumps(value))
            return True
        except:
            return False
    
    def delete(self, key):
        """Supprimer une clé"""
        if not self.available:
            return False
        try:
            self.redis.delete(key)
            return True
        except:
            return False
    
    def cache_result(self, timeout=300):
        """Décorateur pour cache automatique"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Générer clé cache
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
                
                # Vérifier cache
                cached = self.get(cache_key)
                if cached is not None:
                    return cached
                
                # Exécuter fonction
                result = func(*args, **kwargs)
                
                # Mettre en cache
                self.set(cache_key, result, timeout)
                
                return result
            return wrapper
        return decorator

# Instance globale
cache = RedisCache()