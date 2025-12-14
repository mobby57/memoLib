"""Gestionnaire de cache simple"""
import time
import json
import os

class CacheManager:
    def __init__(self, cache_dir="data/cache"):
        self.cache_dir = cache_dir
        self.memory_cache = {}
        self.cache_ttl = 3600  # 1 heure par défaut
        os.makedirs(cache_dir, exist_ok=True)
    
    def get(self, key):
        """Récupère une valeur du cache"""
        # Vérifier le cache mémoire d'abord
        if key in self.memory_cache:
            value, timestamp = self.memory_cache[key]
            if time.time() - timestamp < self.cache_ttl:
                return value
            else:
                del self.memory_cache[key]
        
        # Vérifier le cache fichier
        cache_file = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                    if time.time() - data['timestamp'] < self.cache_ttl:
                        # Remettre en cache mémoire
                        self.memory_cache[key] = (data['value'], data['timestamp'])
                        return data['value']
                    else:
                        os.remove(cache_file)
            except:
                pass
        
        return None
    
    def set(self, key, value, ttl=None):
        """Définit une valeur dans le cache"""
        timestamp = time.time()
        
        # Cache mémoire
        self.memory_cache[key] = (value, timestamp)
        
        # Cache fichier
        cache_file = os.path.join(self.cache_dir, f"{key}.json")
        try:
            with open(cache_file, 'w') as f:
                json.dump({
                    'value': value,
                    'timestamp': timestamp
                }, f)
        except:
            pass
    
    def delete(self, key):
        """Supprime une clé du cache"""
        if key in self.memory_cache:
            del self.memory_cache[key]
        
        cache_file = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(cache_file):
            try:
                os.remove(cache_file)
            except:
                pass
    
    def clear(self):
        """Vide tout le cache"""
        self.memory_cache.clear()
        
        try:
            for filename in os.listdir(self.cache_dir):
                if filename.endswith('.json'):
                    os.remove(os.path.join(self.cache_dir, filename))
        except:
            pass

# Instance globale
cache = CacheManager()