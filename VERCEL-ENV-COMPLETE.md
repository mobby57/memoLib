# 📋 VARIABLES D'ENVIRONNEMENT COMPLÈTES - MEMOLIB

## 🎯 LISTE EXHAUSTIVE (50+ VARIABLES)

---

## 1️⃣ AUTHENTIFICATION & SÉCURITÉ (OBLIGATOIRE)

```bash
# JWT Authentication
JWT_SECRET=votre-secret-jwt-minimum-32-caracteres-ici-changez-moi-absolument
JWT_EXPIRATION=7d
JWT_ISSUER=MemoLib
JWT_AUDIENCE=MemoLib-Users

# NextAuth.js (si frontend Next.js)
NEXTAUTH_SECRET=votre-secret-nextauth-32-caracteres-minimum-changez-moi
NEXTAUTH_URL=https://votre-app.vercel.app
NEXTAUTH_URL_INTERNAL=http://localhost:3000

# Encryption
ENCRYPTION_KEY=votre-cle-chiffrement-32-caracteres-minimum
ENCRYPTION_ALGORITHM=aes-256-gcm

# CORS
CORS_ORIGIN=https://votre-app.vercel.app,https://www.votre-app.vercel.app
CORS_CREDENTIALS=true
```

---

## 2️⃣ BASE DE DONNÉES (OBLIGATOIRE)

```bash
# PostgreSQL Principal
DATABASE_URL=postgresql://user:password@host:5432/memolib?sslmode=require&connection_limit=10

# Prisma Direct URL (sans pooling)
DIRECT_URL=postgresql://user:password@host:5432/memolib?sslmode=require

# Connection Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=30000

# Migrations
DATABASE_MIGRATE_ON_START=true
DATABASE_SEED_ON_START=false

# Backup Database (optionnel)
DATABASE_BACKUP_URL=postgresql://user:password@backup-host:5432/memolib_backup
```

---

## 3️⃣ EMAIL - GMAIL (OBLIGATOIRE)

```bash
# Gmail IMAP (Réception)
EmailMonitor__Username=votre-email@gmail.com
EmailMonitor__Password=xxxx-xxxx-xxxx-xxxx
EmailMonitor__ImapHost=imap.gmail.com
EmailMonitor__ImapPort=993
EmailMonitor__UseSsl=true
EmailMonitor__Enabled=true
EmailMonitor__IntervalSeconds=60

# Gmail SMTP (Envoi)
EmailMonitor__SmtpHost=smtp.gmail.com
EmailMonitor__SmtpPort=587
EmailMonitor__SmtpUseTls=true
EmailMonitor__SmtpTimeout=30000

# Email Settings
EmailMonitor__MaxEmailsPerScan=50
EmailMonitor__MarkAsRead=false
EmailMonitor__DeleteAfterImport=false
EmailMonitor__FolderToMonitor=INBOX
```

---

## 4️⃣ MONITORING & LOGS (RECOMMANDÉ)

```bash
# Sentry Error Tracking
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=votre-token-sentry
SENTRY_ORG=votre-organisation
SENTRY_PROJECT=memolib
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=votre-analytics-id
VERCEL_ANALYTICS_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DESTINATION=console,file
LOG_FILE_PATH=/var/log/memolib.log
LOG_MAX_SIZE=10MB
LOG_MAX_FILES=5
```

---

## 5️⃣ GITHUB INTEGRATION (OPTIONNEL)

```bash
# GitHub OAuth App
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_CALLBACK_URL=https://votre-app.vercel.app/api/auth/callback/github

# GitHub App
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nxxxxx\n-----END RSA PRIVATE KEY-----
GITHUB_WEBHOOK_SECRET=votre-webhook-secret-32-caracteres
GITHUB_INSTALLATION_ID=12345678

# GitHub API
GITHUB_API_URL=https://api.github.com
GITHUB_API_VERSION=2022-11-28
```

---

## 6️⃣ STORAGE & UPLOADS (RECOMMANDÉ)

```bash
# Local Storage
UPLOAD_DIR=/app/uploads
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,jpg,jpeg,png,txt

# AWS S3 (optionnel)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=eu-west-1
AWS_S3_BUCKET=memolib-uploads
AWS_S3_PUBLIC_URL=https://memolib-uploads.s3.eu-west-1.amazonaws.com

# Cloudflare R2 (optionnel)
R2_ACCOUNT_ID=votre-account-id
R2_ACCESS_KEY_ID=votre-access-key
R2_SECRET_ACCESS_KEY=votre-secret-key
R2_BUCKET_NAME=memolib-uploads
R2_PUBLIC_URL=https://uploads.memolib.fr
```

---

## 7️⃣ REDIS & CACHE (OPTIONNEL)

```bash
# Redis (Upstash ou autre)
REDIS_URL=redis://default:password@host:6379
REDIS_TOKEN=votre-redis-token
REDIS_REST_URL=https://xxxxx.upstash.io
REDIS_REST_TOKEN=votre-rest-token

# Cache Settings
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_PREFIX=memolib:
CACHE_MAX_SIZE=100MB
```

---

## 8️⃣ RATE LIMITING & SECURITY (RECOMMANDÉ)

```bash
# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL=false

# Security Headers
SECURITY_HEADERS_ENABLED=true
HSTS_MAX_AGE=31536000
CSP_ENABLED=true
CSP_DIRECTIVES=default-src 'self'; script-src 'self' 'unsafe-inline'

# IP Whitelist (optionnel)
IP_WHITELIST=192.168.1.0/24,10.0.0.0/8
IP_BLACKLIST=

# API Keys
API_KEY_HEADER=X-API-Key
API_KEY_REQUIRED=false
```

---

## 9️⃣ WEBHOOKS & INTEGRATIONS (OPTIONNEL)

```bash
# Webhook Settings
WEBHOOK_ENABLED=true
WEBHOOK_SECRET=votre-webhook-secret-32-caracteres
WEBHOOK_TIMEOUT=30000
WEBHOOK_RETRY_COUNT=3
WEBHOOK_RETRY_DELAY=5000

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
SLACK_CHANNEL=#memolib-notifications
SLACK_USERNAME=MemoLib Bot
SLACK_ICON_EMOJI=:robot_face:

# Microsoft Teams
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxxxx

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx
```

---

## 🔟 AI & EMBEDDINGS (OPTIONNEL)

```bash
# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000

# Embeddings
EMBEDDINGS_ENABLED=true
EMBEDDINGS_MODEL=text-embedding-ada-002
EMBEDDINGS_DIMENSION=1536

# Ollama (local AI)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OLLAMA_ENABLED=false
```

---

## 1️⃣1️⃣ PAYMENT & BILLING (OPTIONNEL)

```bash
# Stripe
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_CURRENCY=eur
STRIPE_PRICE_ID_BASIC=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxx

# PayPal (optionnel)
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_MODE=live
```

---

## 1️⃣2️⃣ NOTIFICATIONS (OPTIONNEL)

```bash
# Push Notifications (OneSignal)
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONESIGNAL_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33612345678

# Email Notifications (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@memolib.fr
SENDGRID_FROM_NAME=MemoLib
```

---

## 1️⃣3️⃣ ANALYTICS & TRACKING (OPTIONNEL)

```bash
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Mixpanel
MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# PostHog
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://app.posthog.com

# Plausible
PLAUSIBLE_DOMAIN=memolib.fr
PLAUSIBLE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 1️⃣4️⃣ FEATURE FLAGS (OPTIONNEL)

```bash
# Feature Toggles
FEATURE_EMAIL_MONITORING=true
FEATURE_AI_SEARCH=true
FEATURE_WEBHOOKS=true
FEATURE_BILLING=false
FEATURE_MOBILE_APP=false
FEATURE_CALENDAR=true
FEATURE_TASKS=true
FEATURE_SIGNATURES=true
FEATURE_FORMS=true

# Beta Features
BETA_FEATURES_ENABLED=false
BETA_USERS=user1@example.com,user2@example.com
```

---

## 1️⃣5️⃣ PERFORMANCE & OPTIMIZATION (OPTIONNEL)

```bash
# Performance
ENABLE_COMPRESSION=true
COMPRESSION_LEVEL=6
ENABLE_HTTP2=true
ENABLE_BROTLI=true

# CDN
CDN_URL=https://cdn.memolib.fr
CDN_ENABLED=true

# Image Optimization
IMAGE_OPTIMIZATION_ENABLED=true
IMAGE_MAX_WIDTH=2000
IMAGE_MAX_HEIGHT=2000
IMAGE_QUALITY=80
```

---

## 1️⃣6️⃣ INTERNATIONALIZATION (OPTIONNEL)

```bash
# i18n
DEFAULT_LOCALE=fr
SUPPORTED_LOCALES=fr,en,de,es,it
LOCALE_DETECTION=true
LOCALE_COOKIE_NAME=NEXT_LOCALE

# Timezone
DEFAULT_TIMEZONE=Europe/Paris
TIMEZONE_DETECTION=true
```

---

## 1️⃣7️⃣ ENVIRONMENT & DEPLOYMENT

```bash
# Environment
NODE_ENV=production
ASPNETCORE_ENVIRONMENT=Production
VERCEL_ENV=production
VERCEL_URL=votre-app.vercel.app

# Build
BUILD_ID=auto
BUILD_TIMESTAMP=auto
GIT_COMMIT_SHA=auto
GIT_BRANCH=main

# Deployment
DEPLOYMENT_REGION=cdg1
DEPLOYMENT_STRATEGY=rolling
HEALTH_CHECK_PATH=/api/health
HEALTH_CHECK_INTERVAL=30
```

---

## 1️⃣8️⃣ LEGAL & COMPLIANCE (RECOMMANDÉ)

```bash
# RGPD
GDPR_ENABLED=true
GDPR_RETENTION_DAYS=2555
GDPR_ANONYMIZATION_ENABLED=true
GDPR_DATA_EXPORT_ENABLED=true

# Legal
TERMS_URL=https://memolib.fr/terms
PRIVACY_URL=https://memolib.fr/privacy
COOKIES_CONSENT_REQUIRED=true

# Audit
AUDIT_LOG_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=365
AUDIT_LOG_LEVEL=info
```

---

## 📊 RÉSUMÉ PAR PRIORITÉ

### 🔴 CRITIQUE (OBLIGATOIRE) - 10 variables
```bash
JWT_SECRET
DATABASE_URL
EmailMonitor__Username
EmailMonitor__Password
NEXTAUTH_SECRET
NEXTAUTH_URL
ENCRYPTION_KEY
CORS_ORIGIN
NODE_ENV
VERCEL_URL
```

### 🟡 IMPORTANT (RECOMMANDÉ) - 15 variables
```bash
SENTRY_DSN
LOG_LEVEL
UPLOAD_DIR
RATE_LIMIT_ENABLED
SECURITY_HEADERS_ENABLED
CACHE_ENABLED
REDIS_URL
GDPR_ENABLED
AUDIT_LOG_ENABLED
FEATURE_EMAIL_MONITORING
FEATURE_AI_SEARCH
DEFAULT_LOCALE
DEFAULT_TIMEZONE
HEALTH_CHECK_PATH
BUILD_ID
```

### 🟢 OPTIONNEL (NICE TO HAVE) - 25+ variables
```bash
GITHUB_CLIENT_ID
AWS_ACCESS_KEY_ID
STRIPE_SECRET_KEY
TWILIO_ACCOUNT_SID
OPENAI_API_KEY
SLACK_WEBHOOK_URL
MIXPANEL_TOKEN
CDN_URL
IMAGE_OPTIMIZATION_ENABLED
... et autres
```

---

## 🎯 CONFIGURATION MINIMALE (10 variables)

```bash
# Copier-coller dans Vercel
JWT_SECRET=changez-moi-32-caracteres-minimum
DATABASE_URL=postgresql://user:pass@host:5432/db
EmailMonitor__Username=email@gmail.com
EmailMonitor__Password=xxxx-xxxx-xxxx-xxxx
NEXTAUTH_SECRET=changez-moi-32-caracteres
NEXTAUTH_URL=https://votre-app.vercel.app
ENCRYPTION_KEY=changez-moi-32-caracteres
CORS_ORIGIN=https://votre-app.vercel.app
NODE_ENV=production
VERCEL_URL=votre-app.vercel.app
```

---

## 🚀 CONFIGURATION COMPLÈTE (40+ variables)

Consultez les sections ci-dessus pour la liste exhaustive.

---

## 📋 TEMPLATE .env COMPLET

Téléchargez: `.env.complete.example`

---

**Total**: 50+ variables disponibles  
**Minimum requis**: 10 variables  
**Recommandé**: 25 variables  
**Complet**: 50+ variables
