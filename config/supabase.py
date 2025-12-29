# Configuration Supabase Gratuite
# Tier gratuit: 500MB, 2GB bandwidth, 50MB file uploads

import os
from supabase import create_client, Client

class SupabaseConfig:
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_ANON_KEY')
        self.service_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL et SUPABASE_ANON_KEY requis dans .env")
        
        self.client = create_client(self.url, self.key)
    
    def get_client(self) -> Client:
        """Retourne le client Supabase"""
        return self.client
    
    def get_database_url(self):
        """URL de connexion PostgreSQL directe"""
        return os.getenv('SUPABASE_DB_URL')

# Configuration Flask-SQLAlchemy optimisée pour Supabase gratuit
SQLALCHEMY_CONFIG = {
    'SQLALCHEMY_DATABASE_URI': os.getenv('SUPABASE_DB_URL'),
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
    'SQLALCHEMY_ENGINE_OPTIONS': {
        'pool_size': 5,  # Limite connexions (tier gratuit)
        'max_overflow': 0,
        'pool_pre_ping': True,
        'pool_recycle': 300,  # Recycler connexions après 5min
        'connect_args': {
            'sslmode': 'require',
            'connect_timeout': 10
        }
    }
}

# Variables d'environnement requises
ENV_TEMPLATE = """
# Supabase Configuration (Gratuit)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres

# Flask
FLASK_ENV=production
SECRET_KEY=your-secret-key

# SMTP (Gmail gratuit)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com

# Redis (Upstash gratuit)
REDIS_URL=redis://default:password@redis-host:6379

# Monitoring (Sentry gratuit)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
"""

def setup_supabase():
    """Guide de configuration Supabase"""
    print("""
🔧 Configuration Supabase (Gratuit)

1. Créer compte: https://supabase.com
2. Nouveau projet (tier gratuit)
3. Récupérer les clés:
   - Project URL
   - Anon key  
   - Service role key
   - Database URL

4. Ajouter dans .env:
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_DB_URL=postgresql://postgres:...

5. Exécuter migration:
   python migrate_to_postgres.py

✅ Tier gratuit: 500MB, 50K requêtes/mois
    """)

if __name__ == "__main__":
    setup_supabase()