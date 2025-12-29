#!/usr/bin/env python3
"""
Deploiement gratuit automatise - Plan IA suivi
Railway + Supabase + Upstash + Sentry (gratuits)
"""

import os
import json
import requests

class FreeDeployment:
    def __init__(self):
        self.project_name = "iapostemanager"
        self.domain = f"{self.project_name}.railway.app"
        
    def create_railway_config(self):
        """Cree configuration Railway"""
        railway_config = {
            "build": {"builder": "NIXPACKS"},
            "deploy": {
                "startCommand": "python app.py",
                "healthcheckPath": "/health",
                "healthcheckTimeout": 100,
                "restartPolicyType": "ON_FAILURE"
            }
        }
        
        with open('railway.json', 'w') as f:
            json.dump(railway_config, f, indent=2)
        
        print("Railway config cree")
    
    def create_env_production(self):
        """Cree template environnement production"""
        env_template = """# Production - Services Gratuits

# Flask
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-change-this

# Supabase PostgreSQL (500MB gratuit)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Upstash Redis (10K requetes/jour gratuit)
REDIS_URL=rediss://default:password@host.upstash.io:6380

# SMTP Gmail (gratuit)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com

# OpenAI (optionnel)
OPENAI_API_KEY=sk-your-openai-key

# Sentry (5K erreurs/mois gratuit)
SENTRY_DSN=https://key@sentry.io/project
"""
        
        with open('.env.production', 'w') as f:
            f.write(env_template)
        
        print("Template .env.production cree")
    
    def create_requirements(self):
        """Cree requirements optimises"""
        requirements = """Flask==2.3.3
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
requests==2.31.0"""
        
        with open('requirements.txt', 'w') as f:
            f.write(requirements)
        
        print("Requirements.txt mis a jour")
    
    def show_deployment_guide(self):
        """Affiche guide de deploiement"""
        guide = """
GUIDE DEPLOIEMENT GRATUIT
========================

1. RAILWAY (Hosting gratuit)
   - Aller sur railway.app
   - Connecter GitHub repo
   - Deploy automatique
   - 500h/mois gratuit

2. SUPABASE (PostgreSQL gratuit)
   - Aller sur supabase.com
   - Creer projet gratuit
   - Recuperer URL + cles
   - 500MB gratuit

3. UPSTASH (Redis gratuit)
   - Aller sur upstash.com
   - Creer base Redis
   - Recuperer URL connexion
   - 10K requetes/jour gratuit

4. SENTRY (Monitoring gratuit)
   - Aller sur sentry.io
   - Creer projet Flask
   - Recuperer DSN
   - 5K erreurs/mois gratuit

5. CONFIGURATION
   - Ajouter variables dans Railway
   - Executer migration PostgreSQL
   - Tester endpoints

COUT TOTAL: 0 euros/mois
"""
        print(guide)
    
    def validate_setup(self):
        """Valide la configuration"""
        print("\nValidation configuration:")
        
        files_to_check = [
            'railway.json',
            '.env.production', 
            'requirements.txt',
            'migrate_to_postgres.py',
            'config/supabase.py',
            'config/redis_free.py'
        ]
        
        for file_path in files_to_check:
            if os.path.exists(file_path):
                print(f"OK: {file_path}")
            else:
                print(f"MANQUE: {file_path}")
    
    def run_deployment(self):
        """Execute le deploiement complet"""
        print("DEPLOIEMENT GRATUIT IA POSTE MANAGER")
        print("=" * 40)
        
        steps = [
            ("Configuration Railway", self.create_railway_config),
            ("Template environnement", self.create_env_production),
            ("Requirements", self.create_requirements),
            ("Guide deploiement", self.show_deployment_guide),
            ("Validation", self.validate_setup)
        ]
        
        for step_name, step_func in steps:
            print(f"\n{step_name}...")
            step_func()
        
        print("\n" + "=" * 40)
        print("DEPLOIEMENT PREPARE!")
        print(f"URL future: https://{self.domain}")
        print("Cout: 0 euros/mois")
        print("\nSuivre le guide ci-dessus pour finaliser")

def main():
    deployer = FreeDeployment()
    deployer.run_deployment()

if __name__ == "__main__":
    main()