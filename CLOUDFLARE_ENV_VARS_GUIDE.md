# 🌐 VARIABLES D'ENVIRONNEMENT - Guide Complet

**Date:** 15 janvier 2026  
**Projet:** IA Poste Manager  
**Plateforme:** Cloudflare Pages

---

## 📋 VARIABLES ESSENTIELLES POUR CLOUDFLARE PAGES

### 🔴 OBLIGATOIRES (Minimum pour démarrer)

| Variable | Valeur Production | Source |
|----------|-------------------|---------|
| `DATABASE_URL` | `file:./dev.db` | SQLite embarqué (ou PostgreSQL externe) |
| `NEXTAUTH_URL` | `https://iapostemanager.pages.dev` | URL Cloudflare Pages |
| `NEXTAUTH_SECRET` | `vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA=` | .env.local |
| `UPSTASH_REDIS_REST_URL` | `https://intimate-bull-28349.upstash.io` | ✅ .env.local |
| `UPSTASH_REDIS_REST_TOKEN` | `AW69AAIncDFmZGNmMzIyNjc5NjE0ODk3OTBjODY5MmM0ZTNhNTJjYnAxMjgzNDk` | ✅ .env.local |

### 🟡 RECOMMANDÉES (Fonctionnalités avancées)

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXT_TELEMETRY_DISABLED` | `1` | Désactive télémétrie Next.js |
| `NODE_ENV` | `production` | Environnement (auto-détecté) |
| `BUILD_VERSION` | `1.0.0` | Version de l'app |
| `REDIS_ENABLED` | `true` | Active cache Redis |

### 🟢 OPTIONNELLES (Email, IA, Analytics)

| Variable | Valeur .env.local | Usage |
|----------|-------------------|-------|
| `SENDGRID_API_KEY` | `SG.Uv8AGV7iTaOEadmaTMEgqw...` | Emails production |
| `SENDGRID_SENDER_EMAIL` | `contact@iapostemanager.com` | Expéditeur emails |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://b8f483c8abdb...` | Monitoring erreurs |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | IA locale (dev only) |
| `OPENAI_API_KEY` | `sk-proj-...` | IA OpenAI (optionnel) |

---

## 🚀 CONFIGURATION CLOUDFLARE PAGES

### Méthode 1 : Dashboard Web (Recommandé)

1. **Aller sur Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   → Workers & Pages
   → iapostemanager
   → Settings
   → Environment variables
   ```

2. **Ajouter variables Production**
   - Cliquer "Add variable"
   - Type: **Production** (environment)
   - Ajouter chaque variable une par une :

   ```env
   DATABASE_URL=file:./dev.db
   NEXTAUTH_URL=https://iapostemanager.pages.dev
   NEXTAUTH_SECRET=vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA=
   UPSTASH_REDIS_REST_URL=https://intimate-bull-28349.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AW69AAIncDFmZGNmMzIyNjc5NjE0ODk3OTBjODY5MmM0ZTNhNTJjYnAxMjgzNDk
   REDIS_ENABLED=true
   NEXT_TELEMETRY_DISABLED=1
   ```

3. **Sauvegarder et redéployer**
   - Cliquer "Save and deploy"
   - Cloudflare redéploie automatiquement

### Méthode 2 : Wrangler CLI

```powershell
# Installer wrangler globalement
npm install -g wrangler

# Ajouter variables
wrangler pages project create iapostemanager

wrangler pages secret put DATABASE_URL --project-name=iapostemanager
# Entrer: file:./dev.db

wrangler pages secret put NEXTAUTH_SECRET --project-name=iapostemanager
# Entrer: vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA=

wrangler pages secret put NEXTAUTH_URL --project-name=iapostemanager
# Entrer: https://iapostemanager.pages.dev

wrangler pages secret put UPSTASH_REDIS_REST_URL --project-name=iapostemanager
# Entrer: https://intimate-bull-28349.upstash.io

wrangler pages secret put UPSTASH_REDIS_REST_TOKEN --project-name=iapostemanager
# Entrer: AW69AAIncDFmZGNmMzIyNjc5NjE0ODk3OTBjODY5MmM0ZTNhNTJjYnAxMjgzNDk
```

### Méthode 3 : GitHub Actions (Automatique)

Les variables sont déjà configurées dans `.github/workflows/cloudflare-pages.yml` :

```yaml
env:
  DATABASE_URL: "file:./dev.db"
  NEXTAUTH_URL: https://iapostemanager.pages.dev
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

**GitHub Secrets à ajouter :**
- `NEXTAUTH_SECRET` → Settings → Secrets → Actions → New repository secret
- `CLOUDFLARE_API_TOKEN` → Pour wrangler deploy
- `CLOUDFLARE_ACCOUNT_ID` → ID compte Cloudflare

---

## 📊 COMPARAISON ENV.LOCAL vs CLOUDFLARE

### Variables IDENTIQUES (copier directement)

| Variable | .env.local ✅ | Cloudflare Production |
|----------|--------------|----------------------|
| `NEXTAUTH_SECRET` | ✅ Utiliser tel quel | ✅ Même valeur |
| `UPSTASH_REDIS_REST_URL` | ✅ URL Upstash | ✅ Même URL |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Token Upstash | ✅ Même token |
| `REDIS_ENABLED` | `true` | `true` |

### Variables DIFFÉRENTES (adapter)

| Variable | .env.local (Dev) | Cloudflare (Prod) |
|----------|------------------|-------------------|
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://iapostemanager.pages.dev` |
| `DATABASE_URL` | `file:./dev.db` | `file:./dev.db` ou PostgreSQL externe |
| `NODE_ENV` | `development` | `production` (auto) |
| `APP_URL` | `http://localhost:3000` | `https://iapostemanager.pages.dev` |

### Variables NON UTILISABLES (serverless)

| Variable | Raison |
|----------|---------|
| `OLLAMA_BASE_URL` | ❌ Ollama local non accessible depuis Cloudflare |
| `WEBSOCKET_PORT` | ❌ Ports fixes incompatibles serverless |
| `REDIS_URL` (TCP) | ❌ Format redis:// incompatible (utiliser REST) |

---

## 🔍 VÉRIFICATION POST-DÉPLOIEMENT

### 1. Tester les variables

```bash
# Depuis terminal local
curl https://iapostemanager.pages.dev/api/health

# Devrait retourner
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-01-15T..."
}
```

### 2. Vérifier logs Cloudflare

1. Dashboard → Workers & Pages → iapostemanager
2. Onglet "Logs"
3. Chercher erreurs comme :
   - `Missing environment variable: XXX`
   - `Redis connection failed`
   - `Database error`

### 3. Tester authentification

```bash
# Ouvrir dans navigateur
https://iapostemanager.pages.dev

# Essayer de se connecter
# Si erreur "NEXTAUTH_URL mismatch" → vérifier variable NEXTAUTH_URL
```

---

## 🛠️ TROUBLESHOOTING

### Erreur : `Missing environment variable: NEXTAUTH_SECRET`

**Solution :**
1. Dashboard Cloudflare → Environment variables
2. Vérifier que `NEXTAUTH_SECRET` est bien ajoutée
3. Cliquer "Save and deploy"

### Erreur : `Redis connection failed`

**Solution :**
1. Vérifier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
2. Tester URL Upstash directement :
   ```bash
   curl https://intimate-bull-28349.upstash.io
   ```
3. Si erreur 401 → token invalide, regénérer sur console.upstash.com

### Erreur : `Database connection failed`

**Solution :**
1. SQLite embarqué : devrait fonctionner avec `file:./dev.db`
2. Si PostgreSQL externe :
   - Vérifier `DATABASE_URL` avec format correct
   - Exemple : `postgresql://user:pass@host:5432/db?sslmode=require`

### Erreur : `NEXTAUTH_URL mismatch`

**Solution :**
1. Vérifier `NEXTAUTH_URL` = `https://iapostemanager.pages.dev` (sans "/" final)
2. Pas `http://` mais `https://`
3. Redéployer après modification

---

## 📝 CHECKLIST DÉPLOIEMENT

### Avant déploiement

- [ ] Variables obligatoires dans .env.local
- [ ] Compte Upstash Redis créé et credentials copiés
- [ ] `NEXTAUTH_SECRET` généré (32+ caractères aléatoires)
- [ ] Build local réussi : `npm run build`

### Pendant configuration Cloudflare

- [ ] Projet Cloudflare Pages créé (iapostemanager)
- [ ] Variables production ajoutées (minimum 5 obligatoires)
- [ ] GitHub Secrets configurés (CLOUDFLARE_API_TOKEN, etc.)
- [ ] Workflow GitHub Actions actif

### Après déploiement

- [ ] URL accessible : https://iapostemanager.pages.dev
- [ ] Page d'accueil charge correctement
- [ ] Authentification fonctionne
- [ ] `/api/health` retourne status OK
- [ ] Logs Cloudflare sans erreurs critiques
- [ ] Redis connecté (visible dans logs)

---

## 🎯 RÉSUMÉ RAPIDE

### 5 Variables MINIMUM pour démarrer :

```env
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=https://iapostemanager.pages.dev
NEXTAUTH_SECRET=vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA=
UPSTASH_REDIS_REST_URL=https://intimate-bull-28349.upstash.io
UPSTASH_REDIS_REST_TOKEN=AW69AAIncDFmZGNmMzIyNjc5NjE0ODk3OTBjODY5MmM0ZTNhNTJjYnAxMjgzNDk
```

### Où les ajouter :

1. **Cloudflare Dashboard** → Workers & Pages → iapostemanager → Settings → Environment variables
2. Ou **Wrangler CLI** : `wrangler pages secret put VARIABLE_NAME`
3. Ou **GitHub Secrets** pour workflow automatique

### Commande pour déployer :

```powershell
# Déploiement automatique (push GitHub)
git add .
git commit -m "feat: configure production environment variables"
git push origin multitenant-render

# Ou déploiement manuel (wrangler)
npm run build
npx wrangler pages deploy .next/standalone --project-name=iapostemanager
```

---

## 🔗 LIENS UTILES

- **Cloudflare Dashboard** : https://dash.cloudflare.com/
- **Upstash Console** : https://console.upstash.com/
- **GitHub Actions** : https://github.com/mobby57/iapostemanager/actions
- **Documentation Cloudflare Pages** : https://developers.cloudflare.com/pages/

---

**✅ Prêt pour production !** 🚀
