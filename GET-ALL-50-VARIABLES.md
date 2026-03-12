# 🔑 OBTENIR LES 50 VARIABLES - GUIDE ULTRA-COMPLET

## 📋 INDEX RAPIDE
- [Essentiels (10 variables)](#essentiels-10-variables) - 20 min, GRATUIT
- [Recommandés (15 variables)](#recommandés-15-variables) - 30 min, GRATUIT
- [Optionnels (25 variables)](#optionnels-25-variables) - 60 min, Variable

---

## 🔴 ESSENTIELS (10 VARIABLES) - 20 MIN, GRATUIT

### 1. JWT_SECRET ⚡ 1 min - GRATUIT
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```
**Résultat**: `xK8vN2mP9qR4sT6uW7yZ0aB1cD3eF5gH8iJ9kL2mN4oP6qR8sT0u==`

### 2. NEXTAUTH_SECRET ⚡ 1 min - GRATUIT
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. ENCRYPTION_KEY ⚡ 1 min - GRATUIT
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 4. DATABASE_URL 🗄️ 5 min - GRATUIT
**Neon PostgreSQL (Recommandé)**
1. 🔗 https://neon.tech
2. Sign Up (gratuit)
3. Create Project → "memolib"
4. Copy "Connection String"

**Format**: `postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require`

**Alternatives**:
- Supabase: https://supabase.com (GRATUIT)
- Railway: https://railway.app (5$ gratuits)
- Vercel Postgres: https://vercel.com/storage (PAYANT)

### 5. DIRECT_URL 🗄️ 1 min - GRATUIT
Même URL que DATABASE_URL (sans pooling)

### 6. EmailMonitor__Username 📧 1 min - GRATUIT
Votre email Gmail: `votre-email@gmail.com`

### 7. EmailMonitor__Password 📧 3 min - GRATUIT
1. 🔗 https://myaccount.google.com/apppasswords
2. Activer validation 2 étapes
3. Créer mot de passe app → "MemoLib"
4. Copier: `xxxx xxxx xxxx xxxx`

### 8. NEXTAUTH_URL 🌐 1 min - GRATUIT
Après déploiement Vercel: `https://votre-app.vercel.app`

### 9. NODE_ENV 🔧 1 min - GRATUIT
```
production
```

### 10. VERCEL_URL 🌐 1 min - GRATUIT
```
votre-app.vercel.app
```

---

## 🟡 RECOMMANDÉS (15 VARIABLES) - 30 MIN, GRATUIT

### 11. SENTRY_DSN 📊 5 min - GRATUIT
1. 🔗 https://sentry.io
2. Sign Up (10k events/mois gratuits)
3. Create Project → Next.js → "memolib"
4. Copy DSN

**Format**: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

### 12. SENTRY_ENVIRONMENT 📊 1 min - GRATUIT
```
production
```

### 13. LOG_LEVEL 📝 1 min - GRATUIT
```
info
```

### 14. REDIS_URL 💾 5 min - GRATUIT
**Upstash Redis (Recommandé)**
1. 🔗 https://upstash.com
2. Sign Up (gratuit)
3. Create Database → Redis
4. Region: Europe (Paris)
5. Copy "REDIS_URL"

**Format**: `redis://default:xxxxx@eu2-xxxxx.upstash.io:6379`

**Alternative**: Redis Cloud https://redis.com/try-free

### 15. CACHE_ENABLED 💾 1 min - GRATUIT
```
true
```

### 16. CACHE_TTL 💾 1 min - GRATUIT
```
3600
```

### 17. RATE_LIMIT_ENABLED 🛡️ 1 min - GRATUIT
```
true
```

### 18. RATE_LIMIT_MAX_REQUESTS 🛡️ 1 min - GRATUIT
```
100
```

### 19. SECURITY_HEADERS_ENABLED 🛡️ 1 min - GRATUIT
```
true
```

### 20. CORS_ORIGIN 🛡️ 1 min - GRATUIT
```
https://votre-app.vercel.app
```

### 21. GDPR_ENABLED ⚖️ 1 min - GRATUIT
```
true
```

### 22. GDPR_RETENTION_DAYS ⚖️ 1 min - GRATUIT
```
2555
```

### 23. AUDIT_LOG_ENABLED 📋 1 min - GRATUIT
```
true
```

### 24. DEFAULT_LOCALE 🌍 1 min - GRATUIT
```
fr
```

### 25. DEFAULT_TIMEZONE 🌍 1 min - GRATUIT
```
Europe/Paris
```

---

## 🟢 OPTIONNELS (25 VARIABLES) - 60 MIN, VARIABLE

### 26-28. GITHUB OAUTH 🐙 5 min - GRATUIT

**GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_WEBHOOK_SECRET**

1. 🔗 https://github.com/settings/developers
2. OAuth Apps → New OAuth App
3. Remplir:
   - Name: MemoLib
   - Homepage: https://votre-app.vercel.app
   - Callback: https://votre-app.vercel.app/api/auth/callback/github
4. Copy Client ID
5. Generate Client Secret → Copy
6. Webhook Secret: Générer avec PowerShell

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 29-31. AWS S3 STORAGE ☁️ 10 min - GRATUIT 12 mois

**AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET**

1. 🔗 https://aws.amazon.com
2. Create Account (gratuit 12 mois)
3. IAM → Users → Add User
4. Name: "memolib-s3"
5. Access: Programmatic
6. Permissions: AmazonS3FullAccess
7. Copy Access Key ID & Secret
8. S3 → Create Bucket → "memolib-uploads"

**Alternative GRATUITE: Cloudflare R2**
1. 🔗 https://dash.cloudflare.com
2. R2 → Create Bucket
3. Manage API Tokens → Create
4. Copy credentials

### 32-33. UPLOAD CONFIG 📁 1 min - GRATUIT

**UPLOAD_DIR**
```
/app/uploads
```

**UPLOAD_MAX_SIZE**
```
10485760
```

### 34-36. STRIPE PAYMENT 💳 10 min - GRATUIT

**STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLIC_KEY**

1. 🔗 https://stripe.com
2. Create Account (gratuit)
3. Developers → API Keys
4. Copy Secret Key (sk_test_xxx)
5. Webhooks → Add Endpoint
6. URL: https://votre-app.vercel.app/api/webhooks/stripe
7. Events: checkout.session.completed
8. Copy Signing Secret (whsec_xxx)

### 37-39. TWILIO SMS 📱 5 min - 15$ GRATUITS

**TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER**

1. 🔗 https://www.twilio.com/try-twilio
2. Sign Up (15$ gratuits)
3. Console → Account Info
4. Copy Account SID (ACxxxxx)
5. Copy Auth Token
6. Phone Numbers → Get Number

### 40. SENDGRID EMAIL 📧 5 min - GRATUIT

**SENDGRID_API_KEY**

1. 🔗 https://sendgrid.com
2. Sign Up (100 emails/jour gratuits)
3. Settings → API Keys
4. Create API Key → Full Access
5. Copy Key (SG.xxxxx)

### 41-43. OPENAI 🤖 5 min - PAYANT (5$+)

**OPENAI_API_KEY, OPENAI_MODEL, EMBEDDINGS_ENABLED**

1. 🔗 https://platform.openai.com
2. Sign Up
3. Add Payment (5$ minimum)
4. API Keys → Create
5. Copy Key (sk-xxxxx)

**OPENAI_MODEL**: `gpt-4`  
**EMBEDDINGS_ENABLED**: `true`

**Alternative GRATUITE: Ollama (Local)**
```bash
# Installer Ollama
# https://ollama.ai
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### 44-46. WEBHOOKS 🔗 5 min - GRATUIT

**WEBHOOK_ENABLED, WEBHOOK_SECRET, SLACK_WEBHOOK_URL**

**WEBHOOK_ENABLED**: `true`

**WEBHOOK_SECRET**: Générer
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**SLACK_WEBHOOK_URL**:
1. 🔗 https://api.slack.com/apps
2. Create App → From Scratch
3. Incoming Webhooks → Activate
4. Add Webhook → Select Channel
5. Copy URL

### 47-48. ANALYTICS 📈 5 min - GRATUIT

**NEXT_PUBLIC_GA_ID, MIXPANEL_TOKEN**

**Google Analytics**:
1. 🔗 https://analytics.google.com
2. Create Account
3. Create Property
4. Copy Measurement ID (G-XXXXXXXXXX)

**Mixpanel**:
1. 🔗 https://mixpanel.com
2. Sign Up (gratuit)
3. Create Project
4. Copy Token

### 49-50. FEATURE FLAGS 🚩 1 min - GRATUIT

**FEATURE_EMAIL_MONITORING, FEATURE_AI_SEARCH**

```
FEATURE_EMAIL_MONITORING=true
FEATURE_AI_SEARCH=true
FEATURE_WEBHOOKS=true
FEATURE_BILLING=false
```

---

## 📊 TABLEAU RÉCAPITULATIF COMPLET

| # | Variable | Service | Temps | Coût | Lien |
|---|----------|---------|-------|------|------|
| 1 | JWT_SECRET | Local | 1 min | GRATUIT | - |
| 2 | NEXTAUTH_SECRET | Local | 1 min | GRATUIT | - |
| 3 | ENCRYPTION_KEY | Local | 1 min | GRATUIT | - |
| 4 | DATABASE_URL | Neon | 5 min | GRATUIT | https://neon.tech |
| 5 | DIRECT_URL | Neon | 1 min | GRATUIT | https://neon.tech |
| 6 | EmailMonitor__Username | Gmail | 1 min | GRATUIT | - |
| 7 | EmailMonitor__Password | Gmail | 3 min | GRATUIT | https://myaccount.google.com/apppasswords |
| 8 | NEXTAUTH_URL | Vercel | 1 min | GRATUIT | - |
| 9 | NODE_ENV | Config | 1 min | GRATUIT | - |
| 10 | VERCEL_URL | Vercel | 1 min | GRATUIT | - |
| 11 | SENTRY_DSN | Sentry | 5 min | GRATUIT | https://sentry.io |
| 12 | REDIS_URL | Upstash | 5 min | GRATUIT | https://upstash.com |
| 13-20 | Security/Cache | Config | 8 min | GRATUIT | - |
| 21-25 | GDPR/i18n | Config | 5 min | GRATUIT | - |
| 26-28 | GitHub | GitHub | 5 min | GRATUIT | https://github.com/settings/developers |
| 29-31 | AWS S3 | AWS/R2 | 10 min | GRATUIT | https://aws.amazon.com |
| 32-33 | Upload | Config | 1 min | GRATUIT | - |
| 34-36 | Stripe | Stripe | 10 min | GRATUIT | https://stripe.com |
| 37-39 | Twilio | Twilio | 5 min | 15$ gratuits | https://www.twilio.com |
| 40 | SendGrid | SendGrid | 5 min | GRATUIT | https://sendgrid.com |
| 41-43 | OpenAI | OpenAI | 5 min | PAYANT | https://platform.openai.com |
| 44-46 | Webhooks | Slack | 5 min | GRATUIT | https://api.slack.com |
| 47-48 | Analytics | GA/Mixpanel | 5 min | GRATUIT | https://analytics.google.com |
| 49-50 | Features | Config | 1 min | GRATUIT | - |

---

## ⏱️ TEMPS TOTAL

- **Minimum (10 variables)**: 20 minutes
- **Recommandé (25 variables)**: 50 minutes
- **Complet (50 variables)**: 110 minutes (~2h)

---

## 💰 COÛT TOTAL

- **Minimum**: 0€
- **Recommandé**: 0€
- **Complet avec options**: ~20€/mois
  - OpenAI: ~10€/mois
  - Twilio: 15$ gratuits puis ~5€/mois
  - Autres: GRATUIT

---

## 🚀 ORDRE D'EXÉCUTION OPTIMAL

### Phase 1: Secrets (5 min)
```powershell
# Générer tous les secrets d'un coup
$JWT_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$NEXTAUTH_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$ENCRYPTION_KEY = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$WEBHOOK_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

Write-Host "JWT_SECRET=$JWT_SECRET"
Write-Host "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
Write-Host "ENCRYPTION_KEY=$ENCRYPTION_KEY"
Write-Host "WEBHOOK_SECRET=$WEBHOOK_SECRET"
```

### Phase 2: Services gratuits (30 min)
1. Neon PostgreSQL (5 min)
2. Gmail App Password (3 min)
3. Sentry (5 min)
4. Upstash Redis (5 min)
5. GitHub OAuth (5 min)
6. Slack Webhook (5 min)
7. Google Analytics (2 min)

### Phase 3: Services optionnels (60 min)
1. AWS S3 ou Cloudflare R2 (10 min)
2. Stripe (10 min)
3. Twilio (5 min)
4. SendGrid (5 min)
5. OpenAI (5 min)
6. Mixpanel (5 min)

### Phase 4: Configuration (10 min)
Remplir les variables de configuration simples

---

## ✅ CHECKLIST COMPLÈTE

### Essentiels (20 min)
- [ ] Générer JWT_SECRET
- [ ] Générer NEXTAUTH_SECRET
- [ ] Générer ENCRYPTION_KEY
- [ ] Créer compte Neon → DATABASE_URL
- [ ] Créer mot de passe Gmail
- [ ] Définir NEXTAUTH_URL
- [ ] Définir NODE_ENV
- [ ] Définir VERCEL_URL

### Recommandés (30 min)
- [ ] Créer compte Sentry → SENTRY_DSN
- [ ] Créer compte Upstash → REDIS_URL
- [ ] Configurer Security (CORS, Rate Limit)
- [ ] Configurer GDPR
- [ ] Configurer i18n

### Optionnels (60 min)
- [ ] GitHub OAuth
- [ ] AWS S3 ou Cloudflare R2
- [ ] Stripe Payment
- [ ] Twilio SMS
- [ ] SendGrid Email
- [ ] OpenAI API
- [ ] Slack Webhooks
- [ ] Google Analytics
- [ ] Mixpanel

---

## 💾 SAUVEGARDE

```bash
# Créer un fichier sécurisé
# NE PAS COMMITER!
cat > .env.secrets.backup << EOF
# Généré le $(date)
JWT_SECRET=xxx
NEXTAUTH_SECRET=xxx
DATABASE_URL=xxx
# ... toutes vos variables
EOF

# Sauvegarder dans un gestionnaire de mots de passe
# 1Password, LastPass, Bitwarden
```

---

## 📞 LIENS DIRECTS

| Service | URL | Gratuit |
|---------|-----|---------|
| Neon | https://neon.tech | ✅ |
| Gmail | https://myaccount.google.com/apppasswords | ✅ |
| Sentry | https://sentry.io | ✅ |
| Upstash | https://upstash.com | ✅ |
| GitHub | https://github.com/settings/developers | ✅ |
| Cloudflare R2 | https://dash.cloudflare.com | ✅ |
| Stripe | https://stripe.com | ✅ |
| Twilio | https://www.twilio.com | 15$ gratuits |
| SendGrid | https://sendgrid.com | ✅ |
| OpenAI | https://platform.openai.com | ❌ Payant |
| Slack | https://api.slack.com | ✅ |
| Google Analytics | https://analytics.google.com | ✅ |
| Mixpanel | https://mixpanel.com | ✅ |

---

**Total**: 50 variables  
**Temps minimum**: 20 minutes  
**Temps complet**: 2 heures  
**Coût minimum**: 0€  
**Coût complet**: ~20€/mois
