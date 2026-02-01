# ⚡ Quick Start: Déployer MemoLib sur Vercel (5 min)

## 🔑 Vos Clés de Sécurité

```
NEXTAUTH_SECRET=li+95I281EhJlwgImcfdszt79uTItIipFuZ23gQrbYs=
SECRET_KEY=225d23f8799ba86f844ab5e82c3cb351154e08b061d2c7dfcedac2b598c076ae
```

**⚠️ Copier-coller exactement ces valeurs dans Vercel!**

## 3️⃣ Étapes Rapides

1. **https://vercel.com/new** → Authentification GitHub
2. **Importer repo**: mobby57/memoLib
3. **Environment Variables** → Ajouter 4 variables:
   - `NEXTAUTH_SECRET` = (voir ci-dessus)
   - `NEXTAUTH_URL` = `https://memolib-ceseda.vercel.app`
   - `DATABASE_URL` = (votre URL PostgreSQL)
   - `SECRET_KEY` = (voir ci-dessus)
4. **Deploy** → Attendre 3-5 min
5. **Vérifier**: https://memolib-ceseda.vercel.app

## ✅ Vérifications Post-Deploy

```bash
# Check version headers
curl -I https://memolib-ceseda.vercel.app | grep x-app-version

# Check homepage
curl https://memolib-ceseda.vercel.app | grep "CESEDA"

# Check API
curl https://memolib-ceseda.vercel.app/api/version
```

## 📚 Docs Complètes

- [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) - Guide détaillé
- [DEPLOY_PRODUCTION.md](DEPLOY_PRODUCTION.md) - Troubleshooting
- [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) - Pre-launch validation

---

**Status**: 🟢 **PRÊT À DÉPLOYER**

Questions? Consultez les guides complètes ci-dessus.
