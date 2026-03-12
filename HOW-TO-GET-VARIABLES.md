# 🔑 COMMENT OBTENIR CHAQUE VARIABLE - GUIDE COMPLET

## 📋 TABLE DES MATIÈRES
1. [Secrets JWT & Auth](#1-secrets-jwt--auth)
2. [Base de données PostgreSQL](#2-base-de-données-postgresql)
3. [Email Gmail](#3-email-gmail)
4. [Monitoring Sentry](#4-monitoring-sentry)
5. [GitHub OAuth](#5-github-oauth)
6. [Storage AWS S3](#6-storage-aws-s3)
7. [Redis Cache](#7-redis-cache)
8. [Stripe Payment](#8-stripe-payment)
9. [Twilio SMS](#9-twilio-sms)
10. [OpenAI](#10-openai)

---

## 1️⃣ SECRETS JWT & AUTH

### JWT_SECRET (GRATUIT - 2 min)

**Méthode 1: PowerShell**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Méthode 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Méthode 3: En ligne**
```
https://generate-secret.vercel.app/32
```

**Résultat**: `xK8vN2mP9qR4sT6uW7yZ0aB1cD3eF5gH8iJ9kL2mN4oP6qR8sT0u==`

### NEXTAUTH_SECRET (GRATUIT - 1 min)
```powershell
# Même méthode que JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### NEXTAUTH_URL (GRATUIT - 1 min)
```
https://votre-app.vercel.app
```
Remplacez par votre URL Vercel après déploiement.

### ENCRYPTION_KEY (GRATUIT - 1 min)
```powershell
# Même méthode que JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 2️⃣ BASE DE DONNÉES POSTGRESQL

### DATABASE_URL (GRATUIT - 5 min)

**Option A: Neon (Recommandé - GRATUIT)**
1. Allez sur https://neon.tech
2. Cliquez sur "Sign Up" (gratuit)
3. Créez un nouveau projet "memolib"
4. Copiez la "Connection String"

**Format**:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/memolib?sslmode=require
```

**Option B: Supabase (GRATUIT)**
1. Allez sur https://supabase.com
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Database → Settings → Connection String
5. Copiez "Connection pooling"

**Option C: Railway (GRATUIT 5$)**
1. Allez sur https://railway.app
2. Créez un compte
3. New Project → PostgreSQL
4. Copiez "DATABASE_URL"

**Option D: Vercel Postgres (PAYANT)**
1. Vercel Dashboard → Storage → Create Database
2. PostgreSQL → Create
3. Copiez les variables

### DIRECT_URL (GRATUIT - 1 min)
```
# Même URL que DATABASE_URL mais sans pooling
postgresql://user:password@host:5432/memolib?sslmode=require
```

---

## 3️⃣ EMAIL GMAIL

### EmailMonitor__Username (GRATUIT - 1 min)
```
votre-email@gmail.com
```
Votre adresse Gmail existante.

### EmailMonitor__Password (GRATUIT - 3 min)

**Étapes**:
1. Allez sur https://myaccount.google.com/apppasswords
2. Connectez-vous à votre compte Gmail
3. Activez la validation en 2 étapes (si pas déjà fait)
4. Sélectionnez "Autre (nom personnalisé)"
5. Entrez "MemoLib"
6. Cliquez sur "Générer"
7. Copiez le mot de passe (format: xxxx xxxx xxxx xxxx)

**Résultat**: `abcd efgh ijkl mnop`

**Note**: Utilisez ce mot de passe, PAS votre mot de passe Gmail normal!

---

## 4️⃣ MONITORING SENTRY

### SENTRY_DSN (GRATUIT - 5 min)

**Étapes**:
1. Allez sur https://sentry.io
2. Créez un compte gratuit (10k events/mois)
3. Create Project → Next.js
4. Nommez "memolib"
5. Copiez le DSN

**Format**:
```
https://xxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### SENTRY_AUTH_TOKEN (GRATUIT - 2 min)
1. Sentry → Settings → Auth Tokens
2. Create New Token
3. Scopes: project:read, project:write
4. Copiez le token

---

## 5️⃣ GITHUB OAUTH

### GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET (GRATUIT - 5 min)

**Étapes**:
1. Allez sur https://github.com/settings/developers
2. OAuth Apps → New OAuth App
3. Remplissez:
   - **Application name**: MemoLib
   - **Homepage URL**: https://votre-app.vercel.app
   - **Authorization callback URL**: https://votre-app.vercel.app/api/auth/callback/github
4. Cliquez sur "Register application"
5. Copiez **Client ID**
6. Cliquez sur "Generate a new client secret"
7. Copiez **Client Secret**

**Résultat**:
```
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### GITHUB_WEBHOOK_SECRET (GRATUIT - 1 min)
```powershell
# Générer un secret
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 6️⃣ STORAGE AWS S3

### AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY (GRATUIT 12 mois - 10 min)

**Étapes**:
1. Allez sur https://aws.amazon.com
2. Créez un compte AWS (gratuit 12 mois)
3. IAM → Users → Add User
4. Nom: "memolib-s3"
5. Access type: Programmatic access
6. Permissions: AmazonS3FullAccess
7. Copiez **Access Key ID** et **Secret Access Key**

**Alternative GRATUITE: Cloudflare R2**
1. Allez sur https://dash.cloudflare.com
2. R2 → Create Bucket
3. Manage R2 API Tokens → Create API Token
4. Copiez les credentials

---

## 7️⃣ REDIS CACHE

### REDIS_URL (GRATUIT - 5 min)

**Option A: Upstash (Recommandé - GRATUIT)**
1. Allez sur https://upstash.com
2. Créez un compte gratuit
3. Create Database → Redis
4. Région: Europe (Paris)
5. Copiez "REDIS_URL"

**Format**:
```
redis://default:xxxxxxxxxxxxx@eu2-xxxxx.upstash.io:6379
```

**Option B: Redis Cloud (GRATUIT 30MB)**
1. Allez sur https://redis.com/try-free
2. Créez un compte
3. Create Database
4. Copiez la connection string

---

## 8️⃣ STRIPE PAYMENT

### STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET (GRATUIT - 10 min)

**Étapes**:
1. Allez sur https://stripe.com
2. Créez un compte (gratuit)
3. Developers → API Keys
4. Copiez **Secret key** (sk_test_xxx pour test)
5. Webhooks → Add endpoint
6. URL: https://votre-app.vercel.app/api/webhooks/stripe
7. Events: checkout.session.completed, payment_intent.succeeded
8. Copiez **Signing secret** (whsec_xxx)

**Résultat**:
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 9️⃣ TWILIO SMS

### TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN (GRATUIT 15$ - 5 min)

**Étapes**:
1. Allez sur https://www.twilio.com/try-twilio
2. Créez un compte (15$ gratuits)
3. Console → Account Info
4. Copiez **Account SID** (ACxxxxx)
5. Copiez **Auth Token**
6. Phone Numbers → Get a Number (gratuit)

**Résultat**:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33612345678
```

---

## 🔟 OPENAI

### OPENAI_API_KEY (PAYANT - 5 min)

**Étapes**:
1. Allez sur https://platform.openai.com
2. Créez un compte
3. Ajoutez un moyen de paiement (5$ minimum)
4. API Keys → Create new secret key
5. Copiez la clé (sk-xxx)

**Résultat**:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Alternative GRATUITE: Ollama (Local)**
```bash
# Installer Ollama localement
# https://ollama.ai
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

---

## 📊 RÉSUMÉ DES COÛTS

| Service | Coût | Temps | Lien |
|---------|------|-------|------|
| JWT Secrets | GRATUIT | 2 min | Local |
| Neon PostgreSQL | GRATUIT | 5 min | https://neon.tech |
| Gmail App Password | GRATUIT | 3 min | https://myaccount.google.com/apppasswords |
| Sentry | GRATUIT | 5 min | https://sentry.io |
| GitHub OAuth | GRATUIT | 5 min | https://github.com/settings/developers |
| Upstash Redis | GRATUIT | 5 min | https://upstash.com |
| Cloudflare R2 | GRATUIT | 5 min | https://dash.cloudflare.com |
| Stripe | GRATUIT | 10 min | https://stripe.com |
| Twilio | 15$ gratuits | 5 min | https://www.twilio.com |
| OpenAI | PAYANT (5$+) | 5 min | https://platform.openai.com |

**Total GRATUIT**: 0€ pour les services essentiels  
**Total avec options**: ~20€/mois (optionnel)

---

## ✅ CHECKLIST D'OBTENTION

### Essentiels (GRATUIT - 20 min)
- [ ] Générer JWT_SECRET (2 min)
- [ ] Générer NEXTAUTH_SECRET (1 min)
- [ ] Créer compte Neon PostgreSQL (5 min)
- [ ] Créer mot de passe app Gmail (3 min)
- [ ] Obtenir NEXTAUTH_URL après déploiement (1 min)

### Recommandés (GRATUIT - 15 min)
- [ ] Créer compte Sentry (5 min)
- [ ] Créer OAuth GitHub (5 min)
- [ ] Créer compte Upstash Redis (5 min)

### Optionnels (GRATUIT/PAYANT - 30 min)
- [ ] Créer compte Stripe (10 min)
- [ ] Créer compte Twilio (5 min)
- [ ] Créer compte OpenAI (5 min)
- [ ] Créer bucket Cloudflare R2 (5 min)

---

## 🚀 ORDRE RECOMMANDÉ

### 1. Commencez par les essentiels (20 min)
```bash
# 1. Générer les secrets
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 2. Créer base de données Neon
# → https://neon.tech

# 3. Créer mot de passe Gmail
# → https://myaccount.google.com/apppasswords
```

### 2. Ajoutez le monitoring (5 min)
```bash
# Créer compte Sentry
# → https://sentry.io
```

### 3. Ajoutez les options selon besoins (variable)
```bash
# GitHub, Stripe, Twilio, etc.
```

---

## 💡 ASTUCES

### Sauvegardez tout!
```bash
# Créez un fichier sécurisé local
# NE PAS COMMITER!
cat > .env.secrets.local << EOF
JWT_SECRET=xxx
DATABASE_URL=xxx
EmailMonitor__Password=xxx
SENTRY_DSN=xxx
EOF
```

### Utilisez un gestionnaire de mots de passe
- 1Password
- LastPass
- Bitwarden

### Documentez vos sources
```bash
# Ajoutez des commentaires
JWT_SECRET=xxx # Généré le 27/02/2026
DATABASE_URL=xxx # Neon - projet memolib
```

---

## 📞 LIENS RAPIDES

| Service | URL | Temps | Coût |
|---------|-----|-------|------|
| Neon | https://neon.tech | 5 min | GRATUIT |
| Gmail | https://myaccount.google.com/apppasswords | 3 min | GRATUIT |
| Sentry | https://sentry.io | 5 min | GRATUIT |
| GitHub | https://github.com/settings/developers | 5 min | GRATUIT |
| Upstash | https://upstash.com | 5 min | GRATUIT |
| Stripe | https://stripe.com | 10 min | GRATUIT |
| Twilio | https://www.twilio.com | 5 min | 15$ gratuits |
| OpenAI | https://platform.openai.com | 5 min | PAYANT |

---

**Temps total minimum**: 20 minutes  
**Temps total complet**: 60 minutes  
**Coût minimum**: 0€  
**Coût complet**: ~20€/mois
