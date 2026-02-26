# 🚀 Quick Deploy Guide - MemoLib Lawyer App

## Vercel Deploy (1-Click)

### Option 1: Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mobby57/memoLib&project-name=memolib&repository-name=memolib)

### Option 2: Manual Setup

1. **Import sur Vercel**
   - Dashboard → New Project
   - Import `mobby57/memoLib`
   - Branch: `phase7-stripe-billing`

2. **Configuration**

   ```
   Root Directory: src/frontend
   Framework: Next.js
   Build Command: npm run build
   Install Command: npm install --legacy-peer-deps
   ```

3. **Environment Variables**

   ```bash
   # Database (Neon PostgreSQL)
   DATABASE_URL=postgresql://user:pass@host.neon.tech/memolib

   # NextAuth
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://your-app.vercel.app

   # Stripe
   STRIPE_SECRET_KEY=sk_live_***
   STRIPE_WEBHOOK_SECRET=whsec_***

   # Redis (Upstash)
   UPSTASH_REDIS_REST_URL=https://***.upstash.io
   UPSTASH_REDIS_REST_TOKEN=***
   ```

4. **Deploy**

   ```bash
   git push origin phase7-stripe-billing
   # Auto-deploy triggered ✅
   ```

5. **Post-Deploy**
   - Migrate database: `npx prisma migrate deploy`
   - Configure Stripe webhook: Dashboard → `https://your-app.vercel.app/api/v1/webhooks/stripe`
   - Test: `https://your-app.vercel.app/api/health`

---

## Railway PostgreSQL

1. **Create Database**
   - New Project → PostgreSQL
   - Copy `DATABASE_URL`

2. **Run Migrations**
   ```bash
   cd src/frontend
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

---

## Quick Checks

### Health Check

```bash
curl https://your-app.vercel.app/api/health
# Expected: {"status":"healthy","database":"connected"}
```

### Test Auth

```bash
# Login page
open https://your-app.vercel.app/fr/auth/login
```

### Webhooks

```bash
# Stripe webhook test
stripe trigger payment_intent.succeeded \
  --webhook https://your-app.vercel.app/api/v1/webhooks/stripe
```

---

## Production URLs

- Frontend: `https://memolib.vercel.app`
- API: `https://memolib.vercel.app/api/v1`
- Health: `https://memolib.vercel.app/api/health`

---

## Troubleshooting

**Build fails?**

- Check env vars in Vercel dashboard
- Verify `--legacy-peer-deps` in install command

**Database errors?**

- Check `DATABASE_URL` format
- Whitelist Vercel IPs in Neon/Railway

**Webhooks not working?**

- Verify `STRIPE_WEBHOOK_SECRET`
- Check signature validation in logs

---

## Next Steps

1. ✅ Deploy successful
2. Configure custom domain
3. Enable Vercel Analytics
4. Set up monitoring (Sentry)
5. Run E2E tests: `npm run test:e2e`
