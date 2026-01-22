# 🚀 GUIDE QUICK - CONFIGURATION VERCEL 3 ENVIRONNEMENTS

**Date:** 22 janvier 2026  
**Temps estimé:** 10 minutes  
**Objectif:** Configurer dev, staging, prod avec les bonnes URLs

---

## ✅ CE QUI EST FAIT

- ✅ Git branches (develop, staging, main) → poussées sur origin
- ✅ Vercel authentifié (mobby57)
- ✅ Projet créé (iapostemanage)
- ✅ .env.local complète avec toutes les clés secrets

---

## 🎯 CONFIGURATION MANUELLE (10 min)

### Étape 1: Ouvrir Vercel Dashboard

**URL:** https://vercel.com/dashboard/iapostemanage/settings/environment-variables

---

### Étape 2: Ajouter variables pour **DEVELOPMENT** (branche develop)

**Environnements sélectionnés:** ☑️ Development

| Variable | Valeur |
|----------|--------|
| `NEXTAUTH_URL` | `https://iapostemanage-dev.vercel.app` |
| `DATABASE_URL` | *(copier de .env.local)* |
| `NEXTAUTH_SECRET` | *(copier de .env.local)* |
| `OLLAMA_BASE_URL` | `http://localhost:11434` |
| `OLLAMA_MODEL` | `llama3.2:3b` |
| `STRIPE_SECRET_KEY` | *(copier de .env.local)* |
| `STRIPE_PUBLISHABLE_KEY` | *(copier de .env.local)* |
| `STRIPE_WEBHOOK_SECRET` | *(copier de .env.local)* |

**Clique:** `Add` après chaque variable

---

### Étape 3: Ajouter variables pour **STAGING** (branche staging)

**Environnements sélectionnés:** ☑️ Preview

| Variable | Valeur |
|----------|--------|
| `NEXTAUTH_URL` | `https://iapostemanage-staging.vercel.app` |
| `DATABASE_URL` | *(même que .env.local)* |
| `NEXTAUTH_SECRET` | *(même que .env.local)* |
| `OLLAMA_BASE_URL` | `https://ollama-staging.yourserver.com` ⚠️ À adapter |
| `OLLAMA_MODEL` | `llama3.2:3b` |
| `STRIPE_SECRET_KEY` | *(copier de .env.local)* |
| `STRIPE_PUBLISHABLE_KEY` | *(copier de .env.local)* |
| `STRIPE_WEBHOOK_SECRET` | *(copier de .env.local)* |

**Note:** NEXTAUTH_URL et OLLAMA_BASE_URL changent!

---

### Étape 4: Ajouter variables pour **PRODUCTION** (branche main)

**Environnements sélectionnés:** ☑️ Production

| Variable | Valeur |
|----------|--------|
| `NEXTAUTH_URL` | `https://iapostemanage.vercel.app` |
| `DATABASE_URL` | *(même que .env.local)* |
| `NEXTAUTH_SECRET` | *(même que .env.local)* |
| `OLLAMA_BASE_URL` | `https://ollama-prod.yourserver.com` ⚠️ À adapter |
| `OLLAMA_MODEL` | `llama3.2:3b` |
| `STRIPE_SECRET_KEY` | *(copier de .env.local)* |
| `STRIPE_PUBLISHABLE_KEY` | *(copier de .env.local)* |
| `STRIPE_WEBHOOK_SECRET` | *(copier de .env.local)* |

---

## ⚡ COMMANDES DE VÉRIFICATION

```powershell
# Vérifier les variables ont été ajoutées
vercel env ls

# Lister vars par environnement
vercel env pull --environment development
vercel env pull --environment preview
vercel env pull --environment production
```

---

## 🧪 TESTS POST-CONFIGURATION

### Test 1: Vérifier les URLs sont actives

```powershell
curl https://iapostemanage-dev.vercel.app/api/health
curl https://iapostemanage-staging.vercel.app/api/health
curl https://iapostemanage.vercel.app/api/health
```

**Réponse attendue:** `{ "status": "ok" }`

---

### Test 2: Vérifier deployments automatiques

Après 2-3 minutes, vérifiez que Vercel a redéployé automatiquement:

```powershell
vercel list
```

Vous devez voir 3 deployments (develop, staging, main) avec **Status: Ready**

---

### Test 3: Vérifier NextAuth marche

Allez sur:
- https://iapostemanage-dev.vercel.app/api/auth/signin
- https://iapostemanage-staging.vercel.app/api/auth/signin

Vous devez voir la page de login.

---

## 📋 CHECKLIST FINALE

- [ ] Variables DEVELOPMENT ajoutées
- [ ] Variables STAGING ajoutées  
- [ ] Variables PRODUCTION ajoutées
- [ ] NEXTAUTH_URL adapté par env ✅
- [ ] DATABASE_URL même dans tous les envs ✅
- [ ] OLLAMA_BASE_URL adapté (dev: localhost, staging: https://, prod: https://)
- [ ] Vercel a redéployé automatiquement
- [ ] 3 URLs répondent avec status 200 ✅
- [ ] Login page accessible sur tous les envs ✅

---

## ⚠️ SI ERREUR

**Problem:** Deployments échouent  
**Solution:** Vérifier DATABASE_URL correcte (Neon PostgreSQL)

**Problem:** API health retourne erreur  
**Solution:** Vérifier NextAuth variables (NEXTAUTH_SECRET, NEXTAUTH_URL)

**Problem:** Pages charge mais sans CSS  
**Solution:** Rebuild manuellement: Dashboard → Deployments → Select → Redeploy

---

## 🎉 SUCCESS!

Après validation ✅, vous avez:

- ✅ 3 environnements configurés (dev, staging, prod)
- ✅ Deployments automatiques sur push (develop → dev, staging → staging, main → prod)
- ✅ Variables d'environnement différentes par env
- ✅ Prêt pour phase B: DB implementation

**Prochaine étape:** Implémenter la DB (InformationUnit + pipeline)

