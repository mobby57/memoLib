# 🚀 Guide de Déploiement - MVP IA Poste Manager

## Vue d'ensemble

Ce guide détaille les différentes options de déploiement du MVP en production.

---

## Option 1 : Déploiement Local (Dev/Test)

### Prérequis
- Windows 10/11
- Python 3.11+
- PowerShell 5.1+

### Étapes

1. **Cloner le projet**
```powershell
cd C:\Users\moros\Desktop
git clone <repo-url> iaPostemanage
cd iaPostemanage
```

2. **Installer les dépendances**
```powershell
pip install -r requirements.txt
```

3. **Vérifier la configuration**
```powershell
python scripts\check_mvp.py
```

4. **Lancer l'API**
```powershell
.\start_mvp.ps1
```

5. **Tester**
```powershell
# Dans un autre terminal
python examples\client_api_example.py
```

---

## Option 2 : Docker (Production Simple)

### Dockerfile API

Créer `Dockerfile.mvp` :
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code source
COPY . .

# Variables d'environnement
ENV FLASK_APP=src.backend.api_mvp
ENV PORT=5000

# Exposer le port
EXPOSE 5000

# Santé
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:5000/api/v1/health || exit 1

# Démarrage
CMD ["python", "src/backend/api_mvp.py"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.mvp
    ports:
      - "5000:5000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    depends_on:
      - redis
      - postgres

  dashboard:
    build:
      context: .
      dockerfile: Dockerfile.mvp
    command: python src/backend/dashboard.py
    ports:
      - "8080:8080"
    env_file:
      - .env
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: iapostemanager
      POSTGRES_USER: iapm
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

### Commandes Docker

```bash
# Build
docker-compose build

# Démarrer
docker-compose up -d

# Logs
docker-compose logs -f api

# Arrêter
docker-compose down

# Redémarrer
docker-compose restart
```

---

## Option 3 : Kubernetes (Production Scalable)

### Déploiement API

`k8s/api-deployment.yaml` :
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iapm-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: iapm-api
  template:
    metadata:
      labels:
        app: iapm-api
    spec:
      containers:
      - name: api
        image: your-registry/iapm-api:1.0.0
        ports:
        - containerPort: 5000
        env:
        - name: MASTER_ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: iapm-secrets
              key: master-encryption-key
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: iapm-secrets
              key: jwt-secret-key
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: iapm-secrets
              key: database-url
        - name: REDIS_URL
          value: "redis://iapm-redis:6379"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: iapm-api
spec:
  selector:
    app: iapm-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

### Secrets

`k8s/secrets.yaml` :
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: iapm-secrets
type: Opaque
data:
  master-encryption-key: <base64-encoded>
  jwt-secret-key: <base64-encoded>
  flask-secret-key: <base64-encoded>
  database-url: <base64-encoded>
```

### Ingress

`k8s/ingress.yaml` :
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iapm-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.iapostemanager.com
    secretName: iapm-tls
  rules:
  - host: api.iapostemanager.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: iapm-api
            port:
              number: 80
```

### Commandes K8s

```bash
# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Deploy API
kubectl apply -f k8s/api-deployment.yaml

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods
kubectl get svc

# Logs
kubectl logs -f deployment/iapm-api

# Scale
kubectl scale deployment/iapm-api --replicas=5
```

---

## Option 4 : Cloud Providers

### Azure App Service

```bash
# Login
az login

# Create resource group
az group create --name iapm-rg --location westeurope

# Create App Service plan
az appservice plan create \
  --name iapm-plan \
  --resource-group iapm-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group iapm-rg \
  --plan iapm-plan \
  --name iapm-api \
  --runtime "PYTHON:3.11"

# Configure env vars
az webapp config appsettings set \
  --resource-group iapm-rg \
  --name iapm-api \
  --settings \
    MASTER_ENCRYPTION_KEY="<value>" \
    JWT_SECRET_KEY="<value>" \
    DATABASE_URL="<value>"

# Deploy
az webapp deployment source config-zip \
  --resource-group iapm-rg \
  --name iapm-api \
  --src mvp.zip
```

### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.11 iapm-api

# Create environment
eb create iapm-prod

# Set env vars
eb setenv \
  MASTER_ENCRYPTION_KEY="<value>" \
  JWT_SECRET_KEY="<value>" \
  DATABASE_URL="<value>"

# Deploy
eb deploy

# Open
eb open
```

### Google Cloud Run

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/iapm-api

# Deploy
gcloud run deploy iapm-api \
  --image gcr.io/PROJECT_ID/iapm-api \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars MASTER_ENCRYPTION_KEY=<value>,JWT_SECRET_KEY=<value>

# Get URL
gcloud run services describe iapm-api --region europe-west1
```

---

## Configuration Production

### .env.production

```bash
# Sécurité
MASTER_ENCRYPTION_KEY=<généré-256-bits>
JWT_SECRET_KEY=<généré-256-bits>
FLASK_SECRET_KEY=<généré-256-bits>
WEBHOOK_SECRET=<généré-256-bits>

# Database (Production)
DATABASE_URL=postgresql://user:pass@host:5432/iapm

# Redis (Production)
REDIS_URL=redis://:password@host:6379

# IA Externe
OPENAI_API_KEY=sk-...

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=WARNING

# Performance
MAX_CONCURRENT_WORKSPACES=500
CACHE_ENABLED=true

# Features
ENABLE_MULTI_CHANNEL=true
ENABLE_EXTERNAL_AI=true
ENABLE_SMS=true
ENABLE_WHATSAPP=true
```

### Checklist Production

- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL
- [ ] Redis pour cache
- [ ] HTTPS activé (certificat SSL)
- [ ] Firewall configuré
- [ ] Rate limiting activé
- [ ] Monitoring configuré (Sentry, Datadog, etc.)
- [ ] Backups automatiques
- [ ] Logs centralisés
- [ ] Health checks configurés
- [ ] Auto-scaling activé
- [ ] Alertes configurées

---

## Monitoring & Observabilité

### Sentry (Error Tracking)

```python
# src/backend/api_mvp.py
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[FlaskIntegration()],
    traces_sample_rate=0.1,
    environment='production'
)
```

### Prometheus Metrics

```python
# src/backend/metrics.py
from prometheus_client import Counter, Histogram, generate_latest

requests_total = Counter(
    'iapm_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'iapm_request_duration_seconds',
    'Request duration'
)

@app.route('/metrics')
def metrics():
    return generate_latest()
```

### Logging Centralisé

```python
# src/backend/logging_config.py
import logging
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'logs/mvp.log',
    maxBytes=10485760,  # 10MB
    backupCount=10
)

formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

handler.setFormatter(formatter)
logging.getLogger().addHandler(handler)
```

---

## Backup & Recovery

### Backup Database

```bash
# PostgreSQL
pg_dump -U user -d iapm > backup_$(date +%Y%m%d).sql

# Automatique (cron)
0 2 * * * /usr/bin/pg_dump -U user -d iapm > /backups/iapm_$(date +\%Y\%m\%d).sql
```

### Backup Files

```bash
# Data directory
tar -czf data_backup_$(date +%Y%m%d).tar.gz data/

# Automatique
0 3 * * * tar -czf /backups/data_$(date +\%Y\%m\%d).tar.gz /app/data
```

### Recovery

```bash
# Restore database
psql -U user -d iapm < backup_20240101.sql

# Restore files
tar -xzf data_backup_20240101.tar.gz
```

---

## Performance Optimization

### Nginx Reverse Proxy

```nginx
upstream iapm_api {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    listen 80;
    server_name api.iapostemanager.com;

    location / {
        proxy_pass http://iapm_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}
```

### Gunicorn (Multi-workers)

```bash
gunicorn \
  --workers 4 \
  --threads 2 \
  --bind 0.0.0.0:5000 \
  --timeout 120 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log \
  src.backend.api_mvp:app
```

---

## Sécurité Production

### SSL/TLS

```bash
# Let's Encrypt
certbot --nginx -d api.iapostemanager.com
```

### Firewall

```bash
# UFW
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Security Headers

```python
# src/backend/api_mvp.py
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    return response
```

---

## Troubleshooting

### Logs

```bash
# API logs
tail -f logs/mvp.log

# Docker logs
docker-compose logs -f api

# K8s logs
kubectl logs -f deployment/iapm-api
```

### Health Check

```bash
curl http://localhost:5000/api/v1/health
```

### Database Connection

```bash
# Test PostgreSQL
psql -U user -h host -d iapm -c "SELECT 1"

# Test Redis
redis-cli -h host ping
```

---

**Le système est maintenant prêt pour le déploiement en production !** 🚀
