# 🎯 MemoLib Deployment Scripts

3 scripts de déploiement prêts à l'emploi:

## 1️⃣ **vercel-deploy.sh** - Frontend Only (RECOMMANDÉ pour commencer)

```bash
chmod +x vercel-deploy.sh
./vercel-deploy.sh staging      # Deploy staging
./vercel-deploy.sh production   # Deploy production
```

**Time**: 5-10 minutes
**What it does**:
- ✅ Verifies CLI & authentication
- ✅ Type checks
- ✅ Deploys to Vercel
- ✅ Health checks
- ✅ Shows next steps

---

## 2️⃣ **fly-deploy.sh** - Backend Only (Après Vercel)

```bash
chmod +x fly-deploy.sh
./fly-deploy.sh staging      # Deploy staging
./fly-deploy.sh production   # Deploy production
```

**Time**: 10-15 minutes
**What it does**:
- ✅ Verifies Fly CLI & authentication
- ✅ Type checks
- ✅ Deploys Docker to Fly.io
- ✅ Runs database migrations
- ✅ Health checks
- ✅ Configures secrets

---

## 3️⃣ **complete-deploy.sh** - Both Platforms (Complete Setup)

```bash
chmod +x complete-deploy.sh
./complete-deploy.sh staging      # Deploy both staging
./complete-deploy.sh production   # Deploy both production
```

**Time**: 20-25 minutes
**What it does**:
- ✅ Deploys frontend to Vercel
- ✅ Deploys backend to Fly.io
- ✅ Runs database migrations
- ✅ Health checks both platforms
- ✅ Configures GitHub webhooks
- ✅ Shows monitoring links

---

## 🚀 Quick Start

### Option A: Fastest (Vercel only, 5 min)
```bash
chmod +x vercel-deploy.sh
./vercel-deploy.sh production
```

### Option B: Complete (Both platforms, 20 min)
```bash
chmod +x complete-deploy.sh
./complete-deploy.sh production
```

### Option C: Manual (Vercel GUI, 10 min)
Visit: https://vercel.com/new → Select mobby57/memoLib → Deploy

---

## ✅ Prerequisites

### For Vercel
```bash
npm install -g vercel
vercel login
```

### For Fly.io
```bash
brew install flyctl
flyctl auth login
```

### For Both
```bash
npm install -g vercel
vercel login

brew install flyctl
flyctl auth login
```

---

## 📝 Environment Variables

### Vercel (Project Settings → Environment Variables)
```
NEXTAUTH_SECRET
NEXTAUTH_URL
DATABASE_URL
GITHUB_APP_ID
GITHUB_APP_CLIENT_ID
GITHUB_APP_CLIENT_SECRET
GITHUB_APP_PRIVATE_KEY
GITHUB_WEBHOOK_SECRET
SENTRY_DSN
SECRET_KEY
```

### Fly.io (via `flyctl secrets set`)
```
DATABASE_URL
GITHUB_APP_ID
GITHUB_APP_CLIENT_ID
GITHUB_APP_CLIENT_SECRET
GITHUB_APP_PRIVATE_KEY
GITHUB_WEBHOOK_SECRET
NEXTAUTH_SECRET
SENTRY_DSN
```

---

## 🔄 After Deployment

1. **Update GitHub Webhook URL**
   - https://github.com/settings/apps/memolib-guardian
   - Change to production URL

2. **Test OAuth**
   - Visit: https://memolib.vercel.app/api/auth/signin
   - Click "GitHub" button

3. **Test Webhooks**
   - Create issue in mobby57/memoLib
   - Check logs for webhook event

4. **Monitor**
   - Vercel: https://vercel.com/dashboard
   - Fly.io: https://fly.io/dashboard
   - Sentry: https://sentry.io

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear caches
rm -rf .next node_modules
npm install
npm run build
```

### Health Check Fails
```bash
# Check logs
vercel logs -a memolib --follow
# or
flyctl logs --follow
```

### Secrets Not Found
```bash
# Verify secrets
vercel env ls
# or
flyctl secrets list
```

### Database Migrations Error
```bash
# Run manually
flyctl ssh console
npx prisma migrate deploy
```

---

## 📊 Status

All scripts are ready. Choose your deployment path:

- **5 min**: `./vercel-deploy.sh production`
- **20 min**: `./complete-deploy.sh production`
- **Manual**: https://vercel.com/new

**Status**: ✅ READY TO DEPLOY
