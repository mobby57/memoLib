import json
import time
import os
from typing import Any, Optional
from ..core.config import Config

class CacheManager:
    def __init__(self, ttl: int = 300):
        self.ttl = ttl
        self.cache_dir = os.path.join(Config.APP_DIR, 'cache')
        os.makedirs(self.cache_dir, exist_ok=True)
    
    def _get_cache_path(self, key: str) -> str:
        return os.path.join(self.cache_dir, f"{key}.json")
    
    def get(self, key: str) -> Optional[Any]:
        cache_path = self._get_cache_path(key)
        
        if not os.path.exists(cache_path):
            return None
        
        try:
            with open(cache_path, 'r') as f:
                data = json.load(f)
            
            if time.time() - data['timestamp'] > self.ttl:
                os.remove(cache_path)
                return None
            
            return data['value']
        except:
            return None
    
    def set(self, key: str, value: Any) -> bool:
        cache_path = self._get_cache_path(key)
        
        try:
            data = {
                'value': value,
                'timestamp': time.time()
            }
            
            with open(cache_path, 'w') as f:
                json.dump(data, f)
            
            return True
        except:
            return False
    
    def delete(self, key: str) -> bool:
        cache_path = self._get_cache_path(key)
        
        try:
            if os.path.exists(cache_path):
                os.remove(cache_path)
            return True
        except:
            return False
    
    def clear(self) -> bool:
        try:
            for filename in os.listdir(self.cache_dir):
                if filename.endswith('.json'):
                    os.remove(os.path.join(self.cache_dir, filename))
            return True
        except:
            return False

# Instance globale
cache = CacheManager()