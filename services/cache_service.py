# Service cache et optimisation
import json
import os
from datetime import datetime, timedelta
from functools import wraps

CACHE_DIR = "data/cache"
CACHE_TTL = 3600  # 1 heure

def ensure_cache_dir():
    os.makedirs(CACHE_DIR, exist_ok=True)

def get_cache_path(key):
    return os.path.join(CACHE_DIR, f"{key}.json")

def get_cache(key):
    """Recupere valeur du cache"""
    ensure_cache_dir()
    path = get_cache_path(key)
    
    if not os.path.exists(path):
        return None
    
    with open(path, 'r') as f:
        data = json.load(f)
    
    # Verifier expiration
    expires = datetime.fromisoformat(data['expires'])
    if datetime.now() > expires:
        os.remove(path)
        return None
    
    return data['value']

def set_cache(key, value, ttl=CACHE_TTL):
    """Sauvegarde valeur en cache"""
    ensure_cache_dir()
    path = get_cache_path(key)
    
    data = {
        'value': value,
        'expires': (datetime.now() + timedelta(seconds=ttl)).isoformat()
    }
    
    with open(path, 'w') as f:
        json.dump(data, f)

def clear_cache(key=None):
    """Efface cache (tout ou cle specifique)"""
    ensure_cache_dir()
    
    if key:
        path = get_cache_path(key)
        if os.path.exists(path):
            os.remove(path)
    else:
        for file in os.listdir(CACHE_DIR):
            os.remove(os.path.join(CACHE_DIR, file))

def cached(ttl=CACHE_TTL):
    """Decorateur pour cacher resultats fonction"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            cache_key = f"{f.__name__}_{str(args)}_{str(kwargs)}"
            
            cached_value = get_cache(cache_key)
            if cached_value is not None:
                return cached_value
            
            result = f(*args, **kwargs)
            set_cache(cache_key, result, ttl)
            return result
        return wrapper
    return decorator
