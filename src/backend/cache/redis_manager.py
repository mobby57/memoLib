import redis
import json
import os
from functools import wraps

class RedisManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
    
    def cache(self, timeout=300):
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                cache_key = f"{f.__name__}:{hash(str(args) + str(kwargs))}"
                cached = self.redis_client.get(cache_key)
                if cached:
                    return json.loads(cached)
                
                result = f(*args, **kwargs)
                self.redis_client.setex(cache_key, timeout, json.dumps(result))
                return result
            return decorated
        return decorator
    
    def invalidate(self, pattern):
        keys = self.redis_client.keys(pattern)
        if keys:
            self.redis_client.delete(*keys)