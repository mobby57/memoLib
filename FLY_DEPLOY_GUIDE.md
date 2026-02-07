# 🚀 Déploiement Fly.io - Guide Complet

## ⚡ Quick Deploy (5 minutes)

### Prérequis
```bash
# Install Fly CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login

# Vérifier
fly version
```

---

## 📦 Configuration

### 1. Mettre à jour fly.toml
Fichier déjà présent, vérifier la configuration:

```toml
app = "memolib"
primary_region = "cdg"  # Paris (France)

[build]
  dockerfile = "Dockerfile.fly"

[env]
  NODE_ENV = "production"
  NEXT_TELEMETRY_DISABLED = "1"

[[services]]
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20

  [[services.http_checks]]
    interval = 10000
    timeout = 2000
    grace_period = 5000
    method = "GET"
    path = "/api/health"
    protocol = "http"

[[vm]]
  memory = "1gb"
  cpus = 1
```

### 2. Mettre à jour Dockerfile.fly

```dockerfile
FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Dependencies
FROM base AS deps
COPY src/frontend/package*.json ./
RUN npm ci --legacy-peer-deps

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY src/frontend ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Runner
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 🔐 Secrets (Variables d'Environnement)

### Configurer les secrets Fly
```bash
# Database (Neon ou Supabase)
fly secrets set DATABASE_URL="postgresql://user:pass@host.neon.tech/memolib"

# NextAuth
fly secrets set NEXTAUTH_SECRET="<openssl rand -base64 32>"
fly secrets set NEXTAUTH_URL="https://memolib.fly.dev"

# Stripe
fly secrets set STRIPE_SECRET_KEY="sk_live_***"
fly secrets set STRIPE_WEBHOOK_SECRET="whsec_***"
fly secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_***"

# Upstash Redis
fly secrets set UPSTASH_REDIS_REST_URL="https://***.upstash.io"
fly secrets set UPSTASH_REDIS_REST_TOKEN="***"

# GitHub OAuth (optionnel)
fly secrets set GITHUB_CLIENT_ID="***"
fly secrets set GITHUB_CLIENT_SECRET="***"

# Sentry (optionnel)
fly secrets set SENTRY_DSN="https://***@sentry.io/***"

# Vérifier secrets
fly secrets list
```

---

## 🚀 Déploiement

### Premier déploiement
```bash
# Créer l'app
fly apps create memolib --org personal

# Déployer
fly deploy

# Vérifier status
fly status

# Voir logs
fly logs
```

### Mises à jour
```bash
# Déployer nouvelle version
fly deploy

# Deploy avec scaling
fly deploy --vm-memory 1024
```

---

## 🗄️ Database Setup

### Option 1: Neon PostgreSQL (Recommandé)
```bash
# Déjà configuré dans DATABASE_URL secret
# Exécuter migrations
fly ssh console
cd /app
npx prisma migrate deploy
npx prisma generate
exit
```

### Option 2: Fly PostgreSQL (Self-hosted)
```bash
# Créer cluster Postgres
fly postgres create --name memolib-db --region cdg

# Attacher à l'app
fly postgres attach memolib-db

# Auto-configure DATABASE_URL secret
fly secrets list
```

---

## 🔄 Migrations Database

### Via SSH
```bash
fly ssh console

# Dans le container
cd /app
npx prisma migrate deploy
npx prisma db seed  # Optionnel
exit
```

### Via Release Command (Automatique)
Ajouter dans `fly.toml`:
```toml
[deploy]
  release_command = "npx prisma migrate deploy"
```

---

## 📊 Monitoring

### Health Checks
```bash
# Test endpoint
curl https://memolib.fly.dev/api/health

# Vérifier métriques
fly dashboard
```

### Logs
```bash
# Temps réel
fly logs

# Dernières 100 lignes
fly logs --lines 100

# Filtrer par app
fly logs -a memolib
```

### Métriques
```bash
# CPU/Memory
fly status

# Détails VM
fly vm status
```

---

## 🔧 Configuration Avancée

### Autoscaling
```toml
[[vm]]
  memory = "1gb"
  cpus = 1

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  max_machines_running = 3
```

### Régions multiples (CDN global)
```bash
# Ajouter région US
fly scale count 2 --region iad

# Ajouter Asie
fly scale count 1 --region sin

# Vérifier distribution
fly status
```

### Custom Domain
```bash
# Ajouter domaine
fly certs add app.memolib.com

# Vérifier certificats
fly certs list

# DNS Configuration
# CNAME app → memolib.fly.dev
```

---

## 🔄 CI/CD avec GitHub Actions

Créer `.github/workflows/fly-deploy.yml`:

```yaml
name: Fly.io Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Setup secrets**:
```bash
# Obtenir token
fly auth token

# Ajouter dans GitHub
# Settings → Secrets → Actions → New secret
# Name: FLY_API_TOKEN
# Value: <your-token>
```

---

## 💰 Pricing Fly.io

### Free Tier
- 3 shared-cpu-1x VMs (256MB RAM)
- 3GB storage
- 160GB bandwidth/mois
- **Parfait pour démo/staging**

### Production (Hobby Plan)
- 1 VM 1GB RAM: **~$5/mois**
- 10GB storage: **~$2/mois**
- 100GB bandwidth: **Inclus**
- **Total: ~$7/mois**

### Scale-Up (recommandé production)
- 2 VMs 1GB (HA): **~$10/mois**
- PostgreSQL managed: **~$15/mois**
- **Total: ~$25/mois**

---

## 🆚 Vercel vs Fly.io

| Feature | Vercel | Fly.io |
|---------|--------|--------|
| **Next.js** | Natif ⭐ | Docker |
| **Edge Functions** | ✅ | ❌ |
| **Compute** | Serverless | VMs persistantes |
| **Database** | Externe | Managed Postgres |
| **Prix (Hobby)** | $20/mois | $7/mois |
| **Regions** | Global CDN | Multi-region |
| **WebSockets** | Limité | ✅ Full |
| **Deploy Speed** | 30s | 2-3min |
| **Custom Docker** | ❌ | ✅ |

**Recommandation**:
- **Vercel**: Meilleur pour Next.js pur, edge functions, déploiement rapide
- **Fly.io**: Meilleur pour contrôle complet, WebSockets, prix bas, Docker custom

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Logs détaillés
fly logs --app memolib

# Build local test
docker build -f Dockerfile.fly -t memolib-test .
docker run -p 3000:3000 memolib-test
```

### Database Connection
```bash
# Tester connexion
fly ssh console
psql $DATABASE_URL

# Vérifier Prisma
npx prisma db pull
```

### Memory Issues
```bash
# Augmenter RAM
fly scale memory 1024

# Vérifier usage
fly vm status
```

### SSL/HTTPS
```bash
# Vérifier certificat
fly certs show

# Renouveler si expiré
fly certs add <domain>
```

---

## ✅ Post-Deploy Checklist

- [ ] App déployée: `fly status`
- [ ] Health check OK: `curl https://memolib.fly.dev/api/health`
- [ ] Secrets configurés: `fly secrets list`
- [ ] Database migrée: `npx prisma migrate deploy`
- [ ] Stripe webhooks: `https://memolib.fly.dev/api/v1/webhooks/stripe`
- [ ] Logs propres: `fly logs`
- [ ] Domain configuré (optionnel)
- [ ] Monitoring actif
- [ ] Backups configurés

---

## 🔗 Ressources

- **Dashboard**: https://fly.io/dashboard
- **Docs**: https://fly.io/docs
- **CLI Ref**: https://fly.io/docs/flyctl
- **Community**: https://community.fly.io

---

## 🚨 Rollback

### Revenir version précédente
```bash
# Lister releases
fly releases

# Rollback
fly releases rollback <version>

# Exemple
fly releases rollback v12
```

---

## 📱 URLs Production

- **App**: https://memolib.fly.dev
- **API**: https://memolib.fly.dev/api/v1
- **Health**: https://memolib.fly.dev/api/health
- **Dashboard**: https://memolib.fly.dev/fr/dashboard

---

**Deploy en 1 commande**: `fly deploy` 🚀
