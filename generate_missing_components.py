#!/usr/bin/env python3
"""
Script d'automatisation pour implémenter les tâches manquantes
Génère le code de base pour accélérer le développement
"""

import os
import sys
from pathlib import Path

def create_directory_structure():
    """Crée la structure de répertoires manquante"""
    directories = [
        'src/backend/middleware',
        'src/backend/services',
        'src/backend/models',
        'src/backend/utils',
        'tests/unit',
        'tests/integration', 
        'tests/load',
        'config',
        'migrations',
        'monitoring',
        'scripts/deployment',
        'docs/api'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}")

def generate_rate_limiter():
    """Génère le middleware de rate limiting"""
    code = '''"""
Rate Limiter Middleware pour IA Poste Manager
"""
from flask import request, jsonify, g
from functools import wraps
import redis
import time
import hashlib

class RateLimiter:
    def __init__(self, redis_client=None):
        self.redis = redis_client or redis.Redis(host='localhost', port=6379, db=0)
    
    def limit(self, max_requests=60, window=60, per='ip'):
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                # Identifier (IP ou user)
                if per == 'ip':
                    identifier = request.remote_addr
                elif per == 'user':
                    identifier = g.get('user_id', request.remote_addr)
                else:
                    identifier = request.remote_addr
                
                # Clé Redis
                key = f"rate_limit:{f.__name__}:{identifier}"
                
                try:
                    # Vérifier limite
                    current = self.redis.get(key)
                    if current is None:
                        # Première requête
                        self.redis.setex(key, window, 1)
                        return f(*args, **kwargs)
                    elif int(current) < max_requests:
                        # Incrémenter
                        self.redis.incr(key)
                        return f(*args, **kwargs)
                    else:
                        # Limite atteinte
                        return jsonify({
                            'error': 'Rate limit exceeded',
                            'retry_after': self.redis.ttl(key)
                        }), 429
                        
                except redis.RedisError:
                    # Fallback si Redis indisponible
                    return f(*args, **kwargs)
            
            return decorated_function
        return decorator

# Instance globale
rate_limiter = RateLimiter()
'''
    
    with open('src/backend/middleware/rate_limiter.py', 'w') as f:
        f.write(code)
    print("✅ Generated: Rate Limiter")

def generate_input_validator():
    """Génère le validateur d'inputs"""
    code = '''"""
Input Validator avec Marshmallow
"""
from marshmallow import Schema, fields, validate, ValidationError
from flask import request, jsonify
from functools import wraps

class EmailSchema(Schema):
    to = fields.Email(required=True)
    subject = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    content = fields.Str(required=True, validate=validate.Length(min=1, max=10000))

class ContactSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    email = fields.Email(required=True)
    company = fields.Str(validate=validate.Length(max=100))

class TemplateSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    subject = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    content = fields.Str(required=True, validate=validate.Length(min=1, max=10000))

def validate_json(schema_class):
    """Décorateur pour valider les données JSON"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                schema = schema_class()
                data = schema.load(request.get_json() or {})
                request.validated_data = data
                return f(*args, **kwargs)
            except ValidationError as err:
                return jsonify({'errors': err.messages}), 400
        return decorated_function
    return decorator

# Sanitization
import bleach

def sanitize_html(content):
    """Nettoie le contenu HTML"""
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li']
    return bleach.clean(content, tags=allowed_tags, strip=True)

def sanitize_text(text):
    """Nettoie le texte simple"""
    return bleach.clean(text, tags=[], strip=True)
'''
    
    with open('src/backend/utils/validators.py', 'w') as f:
        f.write(code)
    print("✅ Generated: Input Validator")

def generate_database_models():
    """Génère les modèles de base de données"""
    code = '''"""
Modèles SQLAlchemy pour PostgreSQL
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    company = db.Column(db.String(100))
    plan = db.Column(db.String(20), default='starter')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    emails = db.relationship('Email', backref='user', lazy=True)
    templates = db.relationship('Template', backref='user', lazy=True)
    contacts = db.relationship('Contact', backref='user', lazy=True)

class Email(db.Model):
    __tablename__ = 'emails'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    to_email = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, sent, failed
    error_message = db.Column(db.Text)
    sent_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Template(db.Model):
    __tablename__ = 'templates'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(500), nullable=False)
    content = db.Column(db.Text, nullable=False)
    variables = db.Column(db.JSON)  # Variables disponibles
    category = db.Column(db.String(50))
    is_public = db.Column(db.Boolean, default=False)
    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Contact(db.Model):
    __tablename__ = 'contacts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    tags = db.Column(db.JSON)  # Liste de tags
    custom_fields = db.Column(db.JSON)  # Champs personnalisés
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'email', name='unique_user_contact'),)

class APIKey(db.Model):
    __tablename__ = 'api_keys'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    key_hash = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    permissions = db.Column(db.JSON)  # Liste des permissions
    last_used = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Usage(db.Model):
    __tablename__ = 'usage'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # email_sent, ai_generated, etc.
    count = db.Column(db.Integer, default=1)
    date = db.Column(db.Date, default=datetime.utcnow().date())
    metadata = db.Column(db.JSON)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'action', 'date', name='unique_daily_usage'),)
'''
    
    with open('src/backend/models/database.py', 'w') as f:
        f.write(code)
    print("✅ Generated: Database Models")

def generate_ai_service():
    """Génère le service IA multi-provider"""
    code = '''"""
Service IA Multi-Provider avec Cache
"""
import os
import hashlib
import json
from abc import ABC, abstractmethod
from functools import lru_cache
import redis

class AIProvider(ABC):
    @abstractmethod
    def generate_email(self, prompt, context=None):
        pass

class OpenAIProvider(AIProvider):
    def __init__(self, api_key):
        import openai
        self.client = openai.OpenAI(api_key=api_key)
    
    def generate_email(self, prompt, context=None):
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu es un assistant IA pour générer des emails professionnels en français."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            return {
                'content': response.choices[0].message.content,
                'tokens_used': response.usage.total_tokens,
                'provider': 'openai'
            }
        except Exception as e:
            raise Exception(f"OpenAI Error: {str(e)}")

class MistralProvider(AIProvider):
    def __init__(self, api_key):
        self.api_key = api_key
    
    def generate_email(self, prompt, context=None):
        # Implémentation Mistral AI
        return {
            'content': f"Email généré par Mistral pour: {prompt}",
            'tokens_used': 100,
            'provider': 'mistral'
        }

class FallbackProvider(AIProvider):
    def generate_email(self, prompt, context=None):
        templates = {
            'remerciement': "Bonjour,\\n\\nJe vous remercie pour votre confiance.\\n\\nCordialement,",
            'relance': "Bonjour,\\n\\nJe me permets de revenir vers vous concernant notre échange.\\n\\nCordialement,",
            'rdv': "Bonjour,\\n\\nJe souhaiterais planifier un rendez-vous avec vous.\\n\\nCordialement,"
        }
        
        # Détection simple du type d'email
        prompt_lower = prompt.lower()
        for key, template in templates.items():
            if key in prompt_lower:
                return {
                    'content': template,
                    'tokens_used': 0,
                    'provider': 'fallback'
                }
        
        return {
            'content': f"Bonjour,\\n\\nConcernant: {prompt}\\n\\nCordialement,\\nMS CONSEILS",
            'tokens_used': 0,
            'provider': 'fallback'
        }

class AIService:
    def __init__(self):
        self.providers = {}
        self.cache = redis.Redis(host='localhost', port=6379, db=1, decode_responses=True)
        self.setup_providers()
    
    def setup_providers(self):
        # OpenAI
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            self.providers['openai'] = OpenAIProvider(openai_key)
        
        # Mistral
        mistral_key = os.getenv('MISTRAL_API_KEY')
        if mistral_key:
            self.providers['mistral'] = MistralProvider(mistral_key)
        
        # Fallback toujours disponible
        self.providers['fallback'] = FallbackProvider()
    
    def generate_email(self, prompt, context=None, preferred_provider='openai'):
        # Cache key
        cache_key = self._get_cache_key(prompt, context)
        
        # Vérifier cache
        try:
            cached = self.cache.get(cache_key)
            if cached:
                return json.loads(cached)
        except:
            pass
        
        # Essayer providers dans l'ordre de préférence
        providers_order = [preferred_provider, 'openai', 'mistral', 'fallback']
        
        for provider_name in providers_order:
            if provider_name in self.providers:
                try:
                    result = self.providers[provider_name].generate_email(prompt, context)
                    
                    # Mettre en cache (24h)
                    try:
                        self.cache.setex(cache_key, 86400, json.dumps(result))
                    except:
                        pass
                    
                    return result
                except Exception as e:
                    print(f"Provider {provider_name} failed: {e}")
                    continue
        
        # Si tout échoue
        raise Exception("All AI providers failed")
    
    def _get_cache_key(self, prompt, context):
        data = f"{prompt}:{json.dumps(context or {}, sort_keys=True)}"
        return f"ai_cache:{hashlib.md5(data.encode()).hexdigest()}"

# Instance globale
ai_service = AIService()
'''
    
    with open('src/backend/services/ai_service.py', 'w') as f:
        f.write(code)
    print("✅ Generated: AI Service")

def generate_docker_config():
    """Génère la configuration Docker"""
    dockerfile = '''FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim as runtime

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
'''
    
    docker_compose = '''version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/iaposte
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./data:/app/data

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: iaposte
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

volumes:
  postgres_data:
'''
    
    with open('Dockerfile.prod', 'w') as f:
        f.write(dockerfile)
    
    with open('docker-compose.prod.yml', 'w') as f:
        f.write(docker_compose)
    
    print("✅ Generated: Docker Configuration")

def generate_ci_cd():
    """Génère le pipeline CI/CD"""
    github_workflow = '''name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379/0
      run: |
        pytest tests/ --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      env:
        DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
      run: |
        echo "$DEPLOY_KEY" > deploy_key
        chmod 600 deploy_key
        ssh -i deploy_key -o StrictHostKeyChecking=no user@$DEPLOY_HOST '
          cd /app &&
          git pull origin main &&
          docker-compose -f docker-compose.prod.yml up -d --build
        '
'''
    
    os.makedirs('.github/workflows', exist_ok=True)
    with open('.github/workflows/ci-cd.yml', 'w') as f:
        f.write(github_workflow)
    
    print("✅ Generated: CI/CD Pipeline")

def generate_monitoring():
    """Génère la configuration de monitoring"""
    prometheus_config = '''global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'iaposte-app'
    static_configs:
      - targets: ['app:5000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
'''
    
    grafana_dashboard = '''{
  "dashboard": {
    "title": "IA Poste Manager",
    "panels": [
      {
        "title": "Emails Sent",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(emails_sent_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}'''
    
    os.makedirs('monitoring', exist_ok=True)
    with open('monitoring/prometheus.yml', 'w') as f:
        f.write(prometheus_config)
    
    with open('monitoring/grafana-dashboard.json', 'w') as f:
        f.write(grafana_dashboard)
    
    print("✅ Generated: Monitoring Configuration")

def main():
    """Exécute toutes les générations"""
    print("🚀 Génération automatique des composants manquants")
    print("=" * 60)
    
    try:
        create_directory_structure()
        generate_rate_limiter()
        generate_input_validator()
        generate_database_models()
        generate_ai_service()
        generate_docker_config()
        generate_ci_cd()
        generate_monitoring()
        
        print("\n" + "=" * 60)
        print("✅ Génération terminée avec succès!")
        print("\n📋 Prochaines étapes:")
        print("1. Installer les dépendances: pip install -r requirements_new.txt")
        print("2. Configurer PostgreSQL et Redis")
        print("3. Migrer la base de données: flask db upgrade")
        print("4. Tester les nouveaux composants")
        print("5. Déployer avec Docker: docker-compose -f docker-compose.prod.yml up")
        
    except Exception as e:
        print(f"❌ Erreur lors de la génération: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()