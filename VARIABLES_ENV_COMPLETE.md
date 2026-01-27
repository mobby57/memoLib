# 🔑 VARIABLES D'ENVIRONNEMENT - IA POSTE MANAGER v3.1
# Toutes les clés nécessaires pour fonctionnement local et production

# ========================================
# 🚀 FLASK (OBLIGATOIRE)
# ========================================
SECRET_KEY=your_secret_key_here_minimum_32_chars
FLASK_ENV=development

# ========================================
# 🔴 REDIS CLOUD - CONNEXION DIRECTE (PRIORITÉ 1)
# ========================================
REDIS_HOST=redis-xxxxx.c267.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=15444
REDIS_PASSWORD=your_redis_password_here

# ========================================
# 🟠 REDIS CLOUD - REST API FALLBACK (PRIORITÉ 2)
# ========================================
REDIS_CLOUD_REST_URL=https://redis-xxxxx.redislabs.com
REDIS_CLOUD_API_KEY=your_rest_api_key_here

# ========================================
# 🟡 REDIS LANGCACHE - IA SÉMANTIQUE (PRIORITÉ 3)
# ========================================
LANGCACHE_SERVER_URL=https://aws-us-east-1.langcache.redis.io
LANGCACHE_CACHE_ID=your_cache_id_here
LANGCACHE_API_KEY=your_langcache_api_key_here

# ========================================
# 🤖 IA & APIs EXTERNES
# ========================================
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here
HUGGINGFACE_API_TOKEN=hf_your_token_here

# ========================================
# 📧 EMAIL & NOTIFICATIONS
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@cabinet-avocat.fr

# ========================================
# 🗄️ BASES DE DONNÉES
# ========================================
DATABASE_URL=postgresql://user:pass@localhost:5432/iaposte
MONGO_URI=mongodb://localhost:27017/iaposte
SQLITE_PATH=./data/iaposte.db

# ========================================
# ☁️ CLOUD STORAGE
# ========================================
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=iaposte-documents
AWS_REGION=eu-west-1

# ========================================
# 🔐 AUTHENTIFICATION
# ========================================
JWT_SECRET_KEY=your_jwt_secret_key_here
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_MICROSOFT_CLIENT_ID=your_microsoft_client_id
OAUTH_MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# ========================================
# 📊 ANALYTICS & MONITORING
# ========================================
REDIS_PROMETHEUS_ENDPOINT=internal.cluster-address
SENTRY_DSN=https://your_sentry_dsn_here
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
MIXPANEL_TOKEN=your_mixpanel_token

# ========================================
# 🔔 WEBHOOKS & INTÉGRATIONS
# ========================================
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxx
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/xxx

# ========================================
# 🌐 DÉPLOIEMENT & CDN
# ========================================
CDN_URL=https://cdn.cabinet-avocat.fr
DOMAIN_NAME=cabinet-avocat.fr
SSL_CERT_PATH=/etc/ssl/certs/cabinet.crt
SSL_KEY_PATH=/etc/ssl/private/cabinet.key

# ========================================
# 🔵 C# ASP.NET CORE (SI UTILISÉ)
# ========================================
REDIS_CONNECTION_STRING=your_host:port,password=your_password
CONNECTION_STRINGS__DEFAULT=Server=localhost;Database=IaPoste;Trusted_Connection=true

# ========================================
# 🟣 PRODUCTION UNIQUEMENT
# ========================================
PORT=5000
FLASK_DEBUG=False
HTTPS_ONLY=True
SECURE_COOKIES=True
WORKERS=4
TIMEZONE=Europe/Paris
LANGUAGE=fr

# ========================================
# 📊 STATUT DES CLÉS
# ========================================
# ✅ OBLIGATOIRE MINIMUM : SECRET_KEY + REDIS_HOST + REDIS_PASSWORD
# 🔄 FALLBACK AUTOMATIQUE : Si direct échoue → REST API
# 🧠 IA AVANCÉE : + LANGCACHE pour cache sémantique
# 🤖 IA COMPLÈTE : + OpenAI/Anthropic/Google pour génération
# 📧 NOTIFICATIONS : + SMTP pour emails automatiques
# 🗄️ PERSISTANCE : + PostgreSQL/MongoDB pour données
# ☁️ STOCKAGE : + AWS S3 pour documents
# 🔐 SÉCURITÉ : + OAuth pour authentification
# 📈 MONITORING : + Sentry/Analytics pour suivi
# 🔔 INTÉGRATIONS : + Slack/Teams/Zapier
# 🚀 PERFORMANCE MAX : Toutes les clés configurées