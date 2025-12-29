# Configuration Redis Gratuite (Upstash)
# Tier gratuit: 10K requêtes/jour, 256MB

import os
import redis
from urllib.parse import urlparse

class UpstashRedis:
    def __init__(self):
        self.redis_url = os.getenv('REDIS_URL') or os.getenv('UPSTASH_REDIS_URL')
        
        if not self.redis_url:
            # Fallback local pour développement
            self.client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        else:
            # Configuration Upstash
            url = urlparse(self.redis_url)
            self.client = redis.Redis(
                host=url.hostname,
                port=url.port,
                password=url.password,
                ssl=True,
                ssl_cert_reqs=None,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
    
    def get_client(self):
        """Retourne le client Redis"""
        return self.client
    
    def test_connection(self):
        """Test la connexion Redis"""
        try:
            self.client.ping()
            return True
        except:
            return False

# Rate Limiter optimisé pour Upstash gratuit
class FreeRateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.daily_limit = 9000  # Garder 1K requêtes de marge
        self.daily_key = f"daily_usage:{self.get_date()}"
    
    def get_date(self):
        from datetime import datetime
        return datetime.now().strftime('%Y-%m-%d')
    
    def check_daily_limit(self):
        """Vérifie la limite quotidienne"""
        try:
            current = self.redis.get(self.daily_key) or 0
            if int(current) >= self.daily_limit:
                return False
            
            # Incrémenter avec expiration 24h
            pipe = self.redis.pipeline()
            pipe.incr(self.daily_key)
            pipe.expire(self.daily_key, 86400)
            pipe.execute()
            
            return True
        except:
            return True  # Fallback si Redis indisponible
    
    def rate_limit(self, key, max_requests=60, window=60):
        """Rate limiting avec économie de requêtes"""
        if not self.check_daily_limit():
            return False
        
        try:
            current = self.redis.get(key)
            if current is None:
                self.redis.setex(key, window, 1)
                return True
            elif int(current) < max_requests:
                self.redis.incr(key)
                return True
            else:
                return False
        except:
            return True

# Configuration pour app.py
def setup_redis_config():
    """Configuration Redis pour l'application"""
    upstash = UpstashRedis()
    
    if upstash.test_connection():
        print("✅ Redis Upstash connecté")
        return upstash.get_client()
    else:
        print("⚠️ Redis non disponible, mode dégradé")
        return None

# Variables d'environnement Upstash
UPSTASH_ENV_TEMPLATE = """
# Upstash Redis (Gratuit - 10K requêtes/jour)
REDIS_URL=redis://default:password@redis-host:6379
UPSTASH_REDIS_URL=rediss://default:password@host:6380

# Ou séparément:
UPSTASH_REDIS_HOST=your-redis.upstash.io
UPSTASH_REDIS_PORT=6380
UPSTASH_REDIS_PASSWORD=your-password
"""

def setup_upstash():
    """Guide configuration Upstash"""
    print("""
🔴 Configuration Upstash Redis (Gratuit)

1. Créer compte: https://upstash.com
2. Créer base Redis (tier gratuit)
3. Récupérer URL de connexion
4. Ajouter dans .env:
   REDIS_URL=rediss://default:password@host:6380

✅ Tier gratuit: 10K requêtes/jour, 256MB
⚠️ Optimisé pour économiser les requêtes
    """)

if __name__ == "__main__":
    setup_upstash()