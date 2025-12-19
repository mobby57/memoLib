"""Cache Redis pour performance"""
import redis
import json
import logging
from functools import wraps

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self, redis_url='redis://localhost:6379'):
        try:
            self.redis = redis.from_url(redis_url, decode_responses=True)
            self.redis.ping()
        except:
            self.redis = None
            logger.warning("Redis non disponible, cache désactivé")
    
    def cache(self, timeout=300):
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                if not self.redis:
                    return f(*args, **kwargs)
                
                cache_key = f"{f.__name__}:{hash(str(args) + str(kwargs))}"
                
                try:
                    cached = self.redis.get(cache_key)
                    if cached:
                        return json.loads(cached)
                except:
                    pass
                
                result = f(*args, **kwargs)
                
                try:
                    self.redis.setex(cache_key, timeout, json.dumps(result))
                except:
                    pass
                
                return result
            return decorated
        return decorator
    
    def invalidate_pattern(self, pattern):
        if self.redis:
            try:
                keys = self.redis.keys(pattern)
                if keys:
                    self.redis.delete(*keys)
            except:
                pass