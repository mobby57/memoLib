"""
Rate Limiter avec Redis + Fallback mémoire
Implémente rate limiting multi-tiers pour protection API
"""
import os
import time
from functools import wraps
from typing import Optional, Dict
from fastapi import HTTPException, Request

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class RateLimiter:
    """Rate limiter avec support Redis ou fallback mémoire"""
    
    def __init__(self):
        self.memory_store: Dict[str, list] = {}
        self.redis_client: Optional[redis.Redis] = None
        
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.Redis(
                    host=os.getenv('REDIS_HOST', 'localhost'),
                    port=int(os.getenv('REDIS_PORT', 6379)),
                    db=1,
                    decode_responses=True,
                    socket_timeout=2
                )
                self.redis_client.ping()
                print("✅ Rate Limiter: Redis connecté")
            except:
                print("⚠️ Rate Limiter: Redis indisponible, fallback mémoire")
                self.redis_client = None
    
    def check_limit(self, key: str, max_requests: int = 100, window_seconds: int = 60) -> bool:
        """
        Vérifie si limite atteinte
        
        Args:
            key: Identifiant unique (IP, user_id, etc.)
            max_requests: Nombre max requêtes dans fenêtre
            window_seconds: Durée fenêtre en secondes
            
        Returns:
            True si autorisé, False si limite atteinte
        """
        now = time.time()
        
        if self.redis_client:
            return self._check_redis(key, max_requests, window_seconds, now)
        else:
            return self._check_memory(key, max_requests, window_seconds, now)
    
    def _check_redis(self, key: str, max_requests: int, window: int, now: float) -> bool:
        """Vérification Redis avec sliding window"""
        pipe = self.redis_client.pipeline()
        
        # Nettoyer anciennes entrées
        pipe.zremrangebyscore(key, 0, now - window)
        # Compter requêtes dans fenêtre
        pipe.zcard(key)
        # Ajouter nouvelle requête
        pipe.zadd(key, {str(now): now})
        # Expiration auto
        pipe.expire(key, window)
        
        results = pipe.execute()
        count = results[1]
        
        return count < max_requests
    
    def _check_memory(self, key: str, max_requests: int, window: int, now: float) -> bool:
        """Fallback mémoire simple"""
        if key not in self.memory_store:
            self.memory_store[key] = []
        
        # Nettoyer anciennes entrées
        self.memory_store[key] = [
            timestamp for timestamp in self.memory_store[key]
            if now - timestamp < window
        ]
        
        if len(self.memory_store[key]) >= max_requests:
            return False
        
        self.memory_store[key].append(now)
        return True
    
    def limit(self, max_requests: int = 100, window_seconds: int = 60):
        """
        Décorateur FastAPI pour rate limiting
        
        Usage:
            @app.post("/api/endpoint")
            @rate_limiter.limit(max_requests=10, window_seconds=60)
            async def endpoint():
                pass
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Extraire request des kwargs
                request = None
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
                if not request and 'request' in kwargs:
                    request = kwargs['request']
                
                if request:
                    # Clé unique par IP + endpoint
                    key = f"ratelimit:{request.client.host}:{request.url.path}"
                    
                    if not self.check_limit(key, max_requests, window_seconds):
                        raise HTTPException(
                            status_code=429,
                            detail={
                                "error": "Rate limit exceeded",
                                "max_requests": max_requests,
                                "window_seconds": window_seconds,
                                "retry_after": window_seconds
                            }
                        )
                
                return await func(*args, **kwargs)
            return wrapper
        return decorator


# Instance globale
rate_limiter = RateLimiter()
