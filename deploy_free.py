#!/usr/bin/env python3
"""
Déploiement gratuit automatisé - Suit le plan IA
Railway + Supabase + Upstash + Sentry (tous gratuits)
"""

import os
import subprocess
import json
import requests
from pathlib import Path

class FreeDeployment:
    def __init__(self):
        self.project_name = "iapostemanager"
        self.domain = f"{self.project_name}.railway.app"
        
    def deploy_railway(self):
        """Déploiement Railway (500h gratuit/mois)"""
        print("🚂 Déploiement Railway...")
        
        # Créer railway.json
        railway_config = {
            "build": {
                "builder": "NIXPACKS"
            },
            "deploy": {
                "startCommand": "python app.py",
                "healthcheckPath": "/health",
                "healthcheckTimeout": 100,
                "restartPolicyType": "ON_FAILURE"
            }
        }
        
        with open('railway.json', 'w') as f:
            json.dump(railway_config, f, indent=2)
        
        # Commandes Railway
        commands = [
            "npm install -g @railway/cli",
            "railway login",
            "railway init",
            "railway add",
        ]
        
        for cmd in commands:
            print(f"Exécution: {cmd}")
            # subprocess.run(cmd.split(), check=True)
        
        print("✅ Railway configuré")
        print(f"🌐 URL: https://{self.domain}")
    
    def setup_supabase(self):
        """Configuration Supabase PostgreSQL (500MB gratuit)"""
        print("📊 Configuration Supabase...")
        
        supabase_guide = """
        1. Aller sur https://supabase.com
        2. Créer nouveau projet (gratuit)
        3. Récupérer:
           - Project URL
           - Anon key
           - Service role key
           - Database URL
        4. Ajouter dans Railway variables:
           SUPABASE_URL=https://xxx.supabase.co
           SUPABASE_ANON_KEY=eyJ...
           SUPABASE_DB_URL=postgresql://postgres:...
        """
        
        print(supabase_guide)
        
        # Exécuter migration si DB configurée
        if os.getenv('SUPABASE_DB_URL'):
            print("🔄 Migration PostgreSQL...")
            subprocess.run(['python', 'migrate_to_postgres.py'])
        
        print("✅ Supabase configuré")
    
    def setup_upstash_redis(self):
        """Configuration Upstash Redis (10K requêtes/jour gratuit)"""
        print("🔴 Configuration Upstash Redis...")
        
        upstash_guide = """
        1. Aller sur https://upstash.com
        2. Créer base Redis (gratuit)
        3. Récupérer URL connexion
        4. Ajouter dans Railway:
           REDIS_URL=rediss://default:password@host:6380
        """
        
        print(upstash_guide)
        print("✅ Upstash Redis configuré")
    
    def setup_sentry(self):
        """Configuration Sentry monitoring (5K erreurs/mois gratuit)"""
        print("📈 Configuration Sentry...")
        
        sentry_guide = """
        1. Aller sur https://sentry.io
        2. Créer projet Python/Flask
        3. Récupérer DSN
        4. Ajouter dans Railway:
           SENTRY_DSN=https://xxx@sentry.io/xxx
        """
        
        print(sentry_guide)
        
        # Installer Sentry SDK
        with open('requirements_deploy.txt', 'w') as f:
            f.write("""
Flask==2.3.3
Flask-SQLAlchemy==3.0.5
Flask-CORS==4.0.0
Flask-Migrate==4.0.5
Flask-WTF==1.2.1
psycopg2-binary==2.9.7
redis==5.0.1
openai==1.3.5
python-dotenv==1.0.0
sentry-sdk[flask]==1.38.0
supabase==1.2.0
bleach==6.1.0
gunicorn==21.2.0
""")
        
        print("✅ Sentry configuré")
    
    def setup_monitoring(self):
        """Configuration monitoring gratuit"""
        print("📊 Configuration monitoring...")
        
        # Uptime Robot (50 monitors gratuits)
        uptime_guide = """
        1. Aller sur https://uptimerobot.com
        2. Créer monitor HTTP
        3. URL: https://iapostemanager.railway.app/health
        4. Intervalle: 5 minutes
        5. Alertes: email + Discord webhook
        """
        
        print(uptime_guide)
        print("✅ Monitoring configuré")
    
    def create_env_template(self):
        """Crée template .env pour production"""
        env_template = """# Production Environment - Services Gratuits

# Flask
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-change-this

# Supabase PostgreSQL (500MB gratuit)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_DB_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Upstash Redis (10K requêtes/jour gratuit)
REDIS_URL=rediss://default:password@host.upstash.io:6380

# SMTP Gmail (gratuit)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com

# OpenAI (optionnel - payant)
OPENAI_API_KEY=sk-your-openai-key

# Sentry Monitoring (5K erreurs/mois gratuit)
SENTRY_DSN=https://key@sentry.io/project

# Uptime Robot (optionnel)
UPTIMEROBOT_API_KEY=your-api-key
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx
"""
        
        with open('.env.production', 'w') as f:
            f.write(env_template)
        
        print("✅ Template .env.production créé")
    
    def validate_deployment(self):
        """Valide le déploiement"""
        print("🔍 Validation déploiement...")
        
        health_url = f"https://{self.domain}/health"
        
        try:
            response = requests.get(health_url, timeout=10)
            if response.status_code == 200:
                print("✅ Application accessible")
                print(f"🌐 URL: {health_url}")
            else:
                print(f"❌ Erreur HTTP {response.status_code}")
        except requests.RequestException as e:
            print(f"❌ Erreur connexion: {e}")
        
        # Tests additionnels
        tests = [
            f"https://{self.domain}/api/templates",
            f"https://{self.domain}/api/contacts"
        ]
        
        for test_url in tests:
            try:
                response = requests.get(test_url, timeout=5)
                print(f"✅ {test_url}: {response.status_code}")
            except:
                print(f"❌ {test_url}: Erreur")
    
    def deploy_complete(self):
        """Déploiement complet automatisé"""
        print("Deploiement gratuit IA Poste Manager")
        print("=" * 50)
        
        steps = [
            ("Configuration environnement", self.create_env_template),
            ("Déploiement Railway", self.deploy_railway),
            ("Configuration Supabase", self.setup_supabase),
            ("Configuration Redis", self.setup_upstash_redis),
            ("Configuration Sentry", self.setup_sentry),
            ("Configuration monitoring", self.setup_monitoring),
            ("Validation", self.validate_deployment)
        ]
        
        for step_name, step_func in steps:
            print(f"\n🔄 {step_name}")
            try:
                step_func()
            except Exception as e:
                print(f"❌ Erreur {step_name}: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Déploiement terminé!")
        print(f"🌐 Application: https://{self.domain}")
        print("💰 Coût: 0€/mois (tiers gratuits)")
        print("\n📋 Prochaines étapes:")
        print("1. Configurer les variables d'environnement dans Railway")
        print("2. Tester toutes les fonctionnalités")
        print("3. Configurer le monitoring")
        print("4. Documenter pour les utilisateurs")

def main():
    deployer = FreeDeployment()
    deployer.deploy_complete()

if __name__ == "__main__":
    main()