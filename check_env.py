#!/usr/bin/env python3
"""
Validation des variables d'environnement
IA Poste Manager v3.1
"""
import os
from dotenv import load_dotenv

def check_env_variables():
    """Vérifier toutes les variables d'environnement"""
    
    load_dotenv()
    
    print("🔍 Vérification des variables d'environnement")
    print("=" * 50)
    
    # Variables obligatoires
    required = {
        "SECRET_KEY": "Clé secrète Flask",
        "REDIS_HOST": "Host Redis Cloud",
        "REDIS_PASSWORD": "Mot de passe Redis"
    }
    
    # Variables par catégorie
    categories = {
        "🔄 REDIS FALLBACK": {
            "REDIS_CLOUD_REST_URL": "URL REST API Redis",
            "REDIS_CLOUD_API_KEY": "Clé API REST Redis"
        },
        "🧠 IA SÉMANTIQUE": {
            "LANGCACHE_SERVER_URL": "URL LangCache",
            "LANGCACHE_CACHE_ID": "ID Cache LangCache",
            "LANGCACHE_API_KEY": "Clé API LangCache"
        },
        "🤖 IA EXTERNES": {
            "OPENAI_API_KEY": "Clé OpenAI",
            "ANTHROPIC_API_KEY": "Clé Anthropic",
            "GOOGLE_AI_API_KEY": "Clé Google AI",
            "HUGGINGFACE_API_TOKEN": "Token HuggingFace"
        },
        "📧 EMAIL": {
            "SMTP_HOST": "Serveur SMTP",
            "SMTP_USER": "Utilisateur email",
            "SMTP_PASSWORD": "Mot de passe email"
        },
        "🗄️ BASES DE DONNÉES": {
            "DATABASE_URL": "URL PostgreSQL",
            "MONGO_URI": "URI MongoDB",
            "SQLITE_PATH": "Chemin SQLite"
        },
        "☁️ CLOUD STORAGE": {
            "AWS_ACCESS_KEY_ID": "Clé AWS",
            "AWS_SECRET_ACCESS_KEY": "Secret AWS",
            "AWS_BUCKET_NAME": "Bucket S3"
        },
        "🔐 AUTHENTIFICATION": {
            "JWT_SECRET_KEY": "Clé JWT",
            "OAUTH_GOOGLE_CLIENT_ID": "Client ID Google",
            "OAUTH_MICROSOFT_CLIENT_ID": "Client ID Microsoft"
        },
        "📊 MONITORING": {
            "REDIS_PROMETHEUS_ENDPOINT": "Endpoint Prometheus",
            "SENTRY_DSN": "DSN Sentry",
            "GOOGLE_ANALYTICS_ID": "ID Google Analytics"
        },
        "🔔 WEBHOOKS": {
            "SLACK_WEBHOOK_URL": "Webhook Slack",
            "TEAMS_WEBHOOK_URL": "Webhook Teams",
            "ZAPIER_WEBHOOK_URL": "Webhook Zapier"
        },
        "🔧 CONFIGURATION": {
            "REDIS_PORT": "Port Redis",
            "PORT": "Port application",
            "FLASK_ENV": "Environnement Flask",
            "TIMEZONE": "Fuseau horaire"
        }
    }
    
    missing_required = []
    total_configured = 0
    total_possible = 0
    
    print("\n✅ VARIABLES OBLIGATOIRES:")
    for var, desc in required.items():
        value = os.getenv(var)
        if value and value != f"your_{var.lower()}_here":
            print(f"  ✓ {var}: {desc} - OK")
        else:
            print(f"  ❌ {var}: {desc} - MANQUANT")
            missing_required.append(var)
    
    for category, vars_dict in categories.items():
        print(f"\n{category}:")
        category_count = 0
        for var, desc in vars_dict.items():
            total_possible += 1
            value = os.getenv(var)
            if value and not value.startswith("your_") and value != "your_" + var.lower() + "_here":
                print(f"  ✓ {var}: {desc} - OK")
                category_count += 1
                total_configured += 1
            else:
                print(f"  ⚪ {var}: {desc} - Non configuré")
        
        if category_count > 0:
            print(f"    → {category_count}/{len(vars_dict)} configurées")
    
    print("\n📊 RÉSUMÉ:")
    print(f"Variables obligatoires: {len(required) - len(missing_required)}/{len(required)}")
    print(f"Variables optionnelles: {total_configured}/{total_possible}")
    completion = (total_configured / total_possible) * 100 if total_possible > 0 else 0
    print(f"Taux de completion: {completion:.1f}%")
    
    if missing_required:
        print(f"\n❌ ERREUR: Variables manquantes: {', '.join(missing_required)}")
        print("➡️  Éditez votre fichier .env")
        return False
    else:
        print("\n✅ Configuration minimale OK!")
        
        if completion >= 80:
            print("🚀 Configuration ENTERPRISE - Toutes fonctionnalités!")
        elif completion >= 60:
            print("⚡ Configuration PROFESSIONNELLE - Très complet!")
        elif completion >= 40:
            print("🔧 Configuration AVANCÉE - Bon niveau!")
        elif completion >= 20:
            print("📱 Configuration STANDARD - Fonctionnel!")
        else:
            print("🔧 Configuration BASIQUE - Minimum viable!")
        
        return True

if __name__ == "__main__":
    success = check_env_variables()
    exit(0 if success else 1)