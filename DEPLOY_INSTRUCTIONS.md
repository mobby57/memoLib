# 🚀 DÉPLOIEMENT EN COURS

## ✅ Étape 1: Vercel CLI Installé
Version: 50.13.2

## 📋 Prochaines Étapes

### 1. Login Vercel
```bash
vercel login
```
→ Suivez les instructions dans le navigateur

### 2. Configurer le Projet
```bash
cd src/frontend
vercel
```
→ Répondez aux questions:
- Set up and deploy? **Y**
- Which scope? **Votre compte**
- Link to existing project? **N**
- Project name? **memolib**
- Directory? **./src/frontend**
- Override settings? **N**

### 3. Configurer les Variables d'Environnement

**Dashboard Vercel → Project → Settings → Environment Variables**

Variables OBLIGATOIRES:
```bash
DATABASE_URL=postgresql://user:pass@host/db
NEXTAUTH_SECRET=<générer: openssl rand -base64 32>
NEXTAUTH_URL=https://memolib.vercel.app
```

Variables OPTIONNELLES (pour fonctionnalités complètes):
```bash
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_***
UPSTASH_REDIS_REST_URL=https://***.upstash.io
UPSTASH_REDIS_REST_TOKEN=***
GITHUB_CLIENT_ID=***
GITHUB_CLIENT_SECRET=***
SENTRY_DSN=https://***@sentry.io/***
```

### 4. Déployer en Production
```bash
cd src/frontend
vercel --prod
```

### 5. Vérifier le Déploiement
```bash
# Attendre 30 secondes puis:
curl https://votre-url.vercel.app/api/health
```

---

## 🎯 Commandes Rapides

```bash
# Login
vercel login

# Setup initial
cd src/frontend && vercel

# Deploy production
cd src/frontend && vercel --prod

# Voir les déploiements
vercel ls

# Voir les logs
vercel logs
```

---

## 📊 Après le Déploiement

1. **Tester l'application**
   - Ouvrir l'URL fournie par Vercel
   - Vérifier /api/health
   - Tester le login

2. **Configurer Stripe Webhooks** (si Stripe configuré)
   - URL: https://votre-url.vercel.app/api/v1/webhooks/stripe
   - Events: checkout.session.completed, customer.subscription.*

3. **Monitoring**
   - Vercel Analytics: Activé automatiquement
   - Sentry: Configuré si SENTRY_DSN défini

---

## 🆘 Troubleshooting

### Build Failed
```bash
# Vérifier les logs
vercel logs

# Tester le build localement
cd src/frontend
npm run build
```

### Variables d'environnement manquantes
```bash
# Lister les variables
vercel env ls

# Ajouter une variable
vercel env add DATABASE_URL
```

### Rollback
```bash
# Lister les déploiements
vercel ls

# Promouvoir un ancien déploiement
vercel promote <deployment-url>
```

---

## 🎉 Succès !

Une fois déployé, votre application sera accessible sur:
**https://memolib.vercel.app** (ou votre domaine custom)

**Prochaines étapes:**
1. Ajouter un domaine custom (optionnel)
2. Configurer le monitoring
3. Inviter des utilisateurs de test

---

**Besoin d'aide?** Consultez: https://vercel.com/docs
