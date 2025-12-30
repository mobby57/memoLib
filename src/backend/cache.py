"""
Redis caching system for IAPosteManager
Provides decorators and utilities for caching API responses
"""
import json
import os
from functools import wraps
from typing import Optional, Any, Callable
from redis import Redis, ConnectionError as RedisConnectionError

# Redis configuration
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_DB = int(os.getenv('REDIS_DB', 0))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)

# Initialize Redis client
try:
    redis_client = Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=REDIS_PASSWORD,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2
    )
    # Test connection
    redis_client.ping()
    CACHE_AVAILABLE = True
    print(f"✅ Redis connected: {REDIS_HOST}:{REDIS_PORT}")
except (RedisConnectionError, Exception) as e:
    redis_client = None
    CACHE_AVAILABLE = False
    print(f"⚠️  Redis not available: {e}")


def cache(expire: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results in Redis
    
    Args:
        expire: Cache expiration time in seconds (default 5 minutes)
        key_prefix: Optional prefix for cache key
        
    Usage:
        @cache(expire=600)  # Cache for 10 minutes
        def get_user_data(user_id):
            return expensive_query(user_id)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Si Redis pas disponible, exécuter fonction normalement
            if not CACHE_AVAILABLE or not redis_client:
                return func(*args, **kwargs)
            
            # Créer clé unique basée sur fonction et arguments
            func_name = f"{key_prefix}:{func.__name__}" if key_prefix else func.__name__
            
            # Sérialiser arguments pour clé
            args_key = json.dumps({
                'args': args,
                'kwargs': sorted(kwargs.items())
            }, sort_keys=True, default=str)
            
            cache_key = f"cache:{func_name}:{hash(args_key)}"
            
            try:
                # Vérifier si résultat en cache
                cached_value = redis_client.get(cache_key)
                if cached_value:
                    print(f"💾 Cache HIT: {cache_key[:50]}...")
                    return json.loads(cached_value)
                
                # Exécuter fonction si pas en cache
                print(f"🔍 Cache MISS: {cache_key[:50]}...")
                result = func(*args, **kwargs)
                
                # Mettre en cache le résultat
                redis_client.setex(
                    cache_key,
                    expire,
                    json.dumps(result, default=str)
                )
                
                return result
                
            except Exception as e:
                print(f"⚠️  Cache error: {e}")
                # En cas d'erreur cache, exécuter fonction normalement
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str = "*") -> int:
    """
    Invalider les clés de cache correspondant au pattern
    
    Args:
        pattern: Pattern Redis pour trouver clés (ex: "user:123:*")
        
    Returns:
        Nombre de clés supprimées
    """
    if not CACHE_AVAILABLE or not redis_client:
        return 0
    
    try:
        keys = redis_client.keys(f"cache:{pattern}")
        if keys:
            deleted = redis_client.delete(*keys)
            print(f"🗑️  Invalidated {deleted} cache keys")
            return deleted
        return 0
    except Exception as e:
        print(f"⚠️  Cache invalidation error: {e}")
        return 0


def invalidate_user_cache(user_id: int) -> int:
    """Invalider tous les caches d'un utilisateur spécifique"""
    return invalidate_cache(f"*user:{user_id}:*")


def cache_stats() -> dict:
    """
    Obtenir statistiques du cache Redis
    
    Returns:
        Dict avec hits, misses, hit_rate, memory_used, etc.
    """
    if not CACHE_AVAILABLE or not redis_client:
        return {
            'available': False,
            'error': 'Redis not connected'
        }
    
    try:
        info = redis_client.info('stats')
        memory_info = redis_client.info('memory')
        
        hits = int(info.get('keyspace_hits', 0))
        misses = int(info.get('keyspace_misses', 0))
        total_requests = hits + misses
        hit_rate = (hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'available': True,
            'hits': hits,
            'misses': misses,
            'total_requests': total_requests,
            'hit_rate': round(hit_rate, 2),
            'memory_used': memory_info.get('used_memory_human', 'Unknown'),
            'keys_count': redis_client.dbsize(),
            'connected_clients': info.get('connected_clients', 0)
        }
    except Exception as e:
        return {
            'available': False,
            'error': str(e)
        }


def get_cached(key: str) -> Optional[Any]:
    """Récupérer valeur du cache directement"""
    if not CACHE_AVAILABLE or not redis_client:
        return None
    
    try:
        value = redis_client.get(f"cache:{key}")
        return json.loads(value) if value else None
    except Exception:
        return None


def set_cached(key: str, value: Any, expire: int = 300) -> bool:
    """Définir valeur dans le cache directement"""
    if not CACHE_AVAILABLE or not redis_client:
        return False
    
    try:
        redis_client.setex(
            f"cache:{key}",
            expire,
            json.dumps(value, default=str)
        )
        return True
    except Exception:
        return False


def clear_all_cache() -> bool:
    """Vider tout le cache (DANGER)"""
    if not CACHE_AVAILABLE or not redis_client:
        return False
    
    try:
        redis_client.flushdb()
        print("🗑️  All cache cleared")
        return True
    except Exception as e:
        print(f"⚠️  Cache clear error: {e}")
        return False


# Helper pour templates de clés communes
class CacheKeys:
    """Templates de clés de cache standardisés"""
    
    @staticmethod
    def user_emails(user_id: int, page: int = 1) -> str:
        return f"user:{user_id}:emails:page:{page}"
    
    @staticmethod
    def user_stats(user_id: int) -> str:
        return f"user:{user_id}:stats"
    
    @staticmethod
    def dashboard_stats() -> str:
        return "dashboard:stats"
    
    @staticmethod
    def email_templates() -> str:
        return "templates:all"
    
    @staticmethod
    def user_contacts(user_id: int) -> str:
        return f"user:{user_id}:contacts"
