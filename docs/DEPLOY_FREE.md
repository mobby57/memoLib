# 🆓 Déploiement GRATUIT - IA Poste Manager

## ☁️ Solutions 100% Gratuites

---

## 🎯 Option 1 : Vercel + Neon + Upstash (RECOMMANDÉ)

### ✅ Totalement Gratuit
- **Vercel** : Hébergement Next.js (100GB bandwidth/mois)
- **Neon** : PostgreSQL (0.5GB storage, 1 projet)
- **Upstash** : Redis (10K commandes/jour)
- **Cloudflare R2** : Storage (10GB gratuit)

### 🚀 Déploiement en 5 Minutes

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel --prod
```

**C'est tout ! 🎉**

---

## 📋 Configuration Détaillée

### 1️⃣ Neon PostgreSQL (Gratuit)

**Créer la base de données :**
1. Aller sur https://neon.tech
2. Créer un compte (gratuit)
3. Créer un projet "iapostemanager"
4. Copier la connection string

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
```

### 2️⃣ Upstash Redis (Gratuit)

**Créer le cache Redis :**
1. Aller sur https://upstash.com
2. Créer un compte (gratuit)
3. Créer une base Redis
4. Copier les credentials

```env
# REST API (Recommandé pour Vercel)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXxxx"

# Ou Redis Protocol
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"
REDIS_ENABLED=true
```

📖 **Guide détaillé :** [UPSTASH_GUIDE.md](./UPSTASH_GUIDE.md)

### 3️⃣ Vercel (Gratuit)

**Déployer l'application :**

```bash
# Dans le dossier du projet
cd c:\Users\moros\Desktop\iaPostemanage

# Déployer
vercel --prod

# Ajouter les variables d'environnement
vercel env add DATABASE_URL
vercel env add REDIS_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

### 4️⃣ Cloudflare R2 (Gratuit - 10GB)

**Pour le stockage de fichiers :**
1. Aller sur https://cloudflare.com
2. Créer un compte
3. Activer R2 Storage
4. Créer un bucket "iaposte-documents"

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=iaposte-documents
```

---

## 🎁 Option 2 : Railway (Gratuit avec limites)

### Avantages
- Tout-en-un (App + DB + Redis)
- $5 gratuit/mois
- Déploiement Git automatique

### Déploiement

```bash
# 1. Installer Railway CLI
npm i -g @railway/cli

# 2. Se connecter
railway login

# 3. Initialiser
railway init

# 4. Ajouter PostgreSQL
railway add --plugin postgresql

# 5. Ajouter Redis
railway add --plugin redis

# 6. Déployer
railway up
```

---

## 💚 Option 3 : Render (Gratuit)

### Services Gratuits
- **Web Service** : 750h/mois
- **PostgreSQL** : 1GB storage
- **Redis** : 25MB

### Déploiement

1. Aller sur https://render.com
2. Connecter votre repo GitHub
3. Créer un "Web Service"
4. Ajouter PostgreSQL (gratuit)
5. Ajouter Redis (gratuit)

**Configuration automatique !**

---

## 🔧 Script de Déploiement Vercel

Créer `scripts/deploy-free.ps1` :

```powershell
# Déploiement gratuit sur Vercel

Write-Host "🚀 Déploiement GRATUIT - IA Poste Manager" -ForegroundColor Cyan

# Vérifier Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installation Vercel CLI..." -ForegroundColor Yellow
    npm i -g vercel
}

# Se connecter
Write-Host "🔐 Connexion à Vercel..." -ForegroundColor Yellow
vercel login

# Déployer
Write-Host "🚀 Déploiement en cours..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host "🌐 Votre app est en ligne !" -ForegroundColor Cyan
```

---

## 📊 Comparaison des Options Gratuites

| Service | Vercel | Railway | Render | Azure Free |
|---------|--------|---------|--------|------------|
| **App Hosting** | ✅ Illimité | ✅ $5/mois | ✅ 750h/mois | ❌ Payant |
| **PostgreSQL** | ➕ Neon | ✅ Inclus | ✅ 1GB | ❌ Payant |
| **Redis** | ➕ Upstash | ✅ Inclus | ✅ 25MB | ❌ Payant |
| **Storage** | ➕ R2 | ❌ Payant | ❌ Payant | ❌ Payant |
| **Bandwidth** | ✅ 100GB | ✅ Illimité | ✅ 100GB | ❌ Payant |
| **SSL** | ✅ Auto | ✅ Auto | ✅ Auto | ✅ Auto |
| **Domaine** | ✅ .vercel.app | ✅ .railway.app | ✅ .onrender.com | ✅ .azurewebsites.net |
| **CI/CD** | ✅ Auto | ✅ Auto | ✅ Auto | ⚙️ Manuel |

**🏆 Gagnant : Vercel + Neon + Upstash**

---

## 🎯 Déploiement Recommandé (100% Gratuit)

### Étape par Étape

#### 1. Créer les Comptes (5 min)

```
✅ Vercel : https://vercel.com/signup
✅ Neon : https://neon.tech/signup
✅ Upstash : https://upstash.com/signup
✅ Cloudflare : https://cloudflare.com/signup (optionnel)
```

#### 2. Configurer Neon PostgreSQL (2 min)

```bash
# 1. Créer un projet sur Neon
# 2. Copier la connection string
# 3. Ajouter dans .env.local

DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
```

#### 3. Configurer Upstash Redis (2 min)

```bash
# 1. Créer une base Redis sur Upstash
# 2. Copier l'URL
# 3. Ajouter dans .env.local

REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"
```

#### 4. Déployer sur Vercel (3 min)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod

# Ajouter les variables d'environnement
vercel env add DATABASE_URL
vercel env add REDIS_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add OLLAMA_BASE_URL
```

#### 5. Exécuter les Migrations (1 min)

```bash
# Depuis votre machine locale
npx prisma migrate deploy
npx prisma db seed
```

**Total : 13 minutes ⚡**

---

## 🔐 Variables d'Environnement Vercel

```bash
# Base de données
vercel env add DATABASE_URL production

# Redis
vercel env add REDIS_URL production
vercel env add REDIS_ENABLED production

# Auth
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production

# Email (SendGrid gratuit : 100 emails/jour)
vercel env add SENDGRID_API_KEY production

# Ollama (optionnel - utiliser API externe)
vercel env add OLLAMA_BASE_URL production
```

---

## 💡 Alternatives Gratuites par Service

### Base de Données PostgreSQL
- ✅ **Neon** : 0.5GB gratuit (recommandé)
- ✅ **Supabase** : 500MB gratuit
- ✅ **ElephantSQL** : 20MB gratuit
- ✅ **Railway** : Inclus dans $5/mois

### Redis
- ✅ **Upstash** : 10K commandes/jour (recommandé)
- ✅ **Redis Cloud** : 30MB gratuit
- ✅ **Railway** : Inclus dans $5/mois

### Storage Fichiers
- ✅ **Cloudflare R2** : 10GB gratuit
- ✅ **Supabase Storage** : 1GB gratuit
- ✅ **Vercel Blob** : 500MB gratuit

### Email
- ✅ **SendGrid** : 100 emails/jour gratuit
- ✅ **Resend** : 100 emails/jour gratuit
- ✅ **Mailgun** : 5000 emails/mois gratuit

### Monitoring
- ✅ **Vercel Analytics** : Inclus
- ✅ **Sentry** : 5K events/mois gratuit
- ✅ **LogTail** : 1GB/mois gratuit

---

## 📈 Limites des Plans Gratuits

### Vercel
- ✅ Bandwidth : 100GB/mois
- ✅ Builds : 6000 min/mois
- ✅ Serverless : 100GB-Hrs
- ✅ Edge : Illimité

### Neon
- ✅ Storage : 0.5GB
- ✅ Compute : 191.9 heures/mois
- ✅ Projets : 1
- ⚠️ Pause après 5 min d'inactivité

### Upstash
- ✅ Commandes : 10K/jour
- ✅ Storage : 256MB
- ✅ Bandwidth : 200MB/jour

**Suffisant pour 100-500 utilisateurs actifs !**

---

## 🚀 Commandes Rapides

```bash
# Déploiement complet
npm i -g vercel
vercel login
vercel --prod

# Voir les logs
vercel logs

# Voir les déploiements
vercel ls

# Rollback
vercel rollback

# Ajouter un domaine
vercel domains add votredomaine.com
```

---

## 🎁 Bonus : GitHub Actions Gratuit

Créer `.github/workflows/vercel-deploy.yml` :

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma generate
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## ✅ Checklist Déploiement Gratuit

- [ ] Compte Vercel créé
- [ ] Compte Neon créé (PostgreSQL)
- [ ] Compte Upstash créé (Redis)
- [ ] Vercel CLI installé
- [ ] Variables d'environnement configurées
- [ ] Code déployé sur Vercel
- [ ] Migrations exécutées
- [ ] Application accessible
- [ ] GitHub Actions configuré (optionnel)

---

## 🎉 Résultat

**Coût total : 0€/mois** 🆓

**Capacité :**
- 100GB bandwidth/mois
- 0.5GB PostgreSQL
- 10K requêtes Redis/jour
- SSL automatique
- Domaine .vercel.app
- CI/CD automatique

**Parfait pour :**
- Développement
- MVP
- Démo
- 100-500 utilisateurs

---

## 📞 Support

- 📖 [Vercel Docs](https://vercel.com/docs)
- 📖 [Neon Docs](https://neon.tech/docs)
- 📖 [Upstash Docs](https://upstash.com/docs)

**Déployez gratuitement en 13 minutes ! 🚀**
