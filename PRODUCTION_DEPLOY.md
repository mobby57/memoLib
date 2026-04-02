# 🚀 Guide Déploiement Production - MemoLib

## ✅ Checklist Pré-Déploiement

### 1. Tests (5 min)
```bash
cd src/frontend
npm run lint
npm run type-check
npx playwright test --workers=100%
```

### 2. Variables d'Environnement Vercel

**Dashboard Vercel → Settings → Environment Variables**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Auth
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=https://memolib.fr

# Stripe
STRIPE_SECRET_KEY=sk_live_***
STRIPE_WEBHOOK_SECRET=whsec_***
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_***

# Redis
UPSTASH_REDIS_REST_URL=https://***.upstash.io
UPSTASH_REDIS_REST_TOKEN=***

# GitHub OAuth
GITHUB_CLIENT_ID=***
GITHUB_CLIENT_SECRET=***

# Sentry
SENTRY_DSN=https://***@sentry.io/***

# Cron
CRON_SECRET=<random-string>
```

### 3. Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer
cd src/frontend
vercel --prod
```

### 4. Configuration Stripe Webhooks

**Stripe Dashboard → Developers → Webhooks**

```
URL: https://memolib.fr/api/v1/webhooks/stripe
Events:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

### 5. Database Migrations

```bash
cd src/frontend
npx prisma migrate deploy
```

### 6. Vérifications Post-Déploiement

```bash
# Health check
curl https://memolib.fr/api/health

# API test
curl https://memolib.fr/api/v1/dossiers

# Lighthouse score
npx lighthouse https://memolib.fr --view
```

## 🔧 Configuration DNS (si domaine custom)

```
Type  Name    Value
A     @       76.76.21.21
CNAME www     cname.vercel-dns.com
```

## 📊 Monitoring

### Sentry
- Dashboard: https://sentry.io/organizations/memolib
- Alertes configurées pour erreurs critiques

### Uptime Robot (Gratuit)
1. Créer compte: https://uptimerobot.com
2. Ajouter monitor: https://memolib.fr/api/health
3. Intervalle: 5 minutes
4. Alertes: Email + Slack

### Vercel Analytics
- Activé automatiquement
- Dashboard: https://vercel.com/analytics

## 🔄 Rollback

```bash
# Lister déploiements
vercel ls

# Rollback
vercel rollback <deployment-url>
```

## 🚨 Incidents

### API Down
1. Vérifier Vercel status
2. Vérifier Database connection
3. Rollback si nécessaire

### Database Issues
1. Vérifier Railway/Neon dashboard
2. Vérifier connection pool
3. Restore backup si nécessaire

### Stripe Webhooks Failed
1. Vérifier Stripe dashboard
2. Re-trigger webhook manuellement
3. Vérifier logs Vercel

## 📈 Métriques à Suivre

- **Uptime**: > 99.9%
- **Response time**: < 500ms
- **Error rate**: < 0.1%
- **Lighthouse score**: > 90

## 🎉 Déploiement Réussi !

Votre application est maintenant en production sur:
- **Frontend**: https://memolib.fr
- **API**: https://memolib.fr/api
- **Dashboard**: https://memolib.fr/dashboard

---

**Support**: support@memolib.com
