# Configuration OAuth GitHub - Netlify Production

## 🎯 URLs de Déploiement

### Production Fly.io
- **URL**: https://memolib.fly.dev
- **Callback OAuth**: https://memolib.fly.dev/api/auth/callback/github

### Production Netlify
- **URL**: https://bright-dodol-d4bf9b.netlify.app
- **Callback OAuth**: https://bright-dodol-d4bf9b.netlify.app/api/auth/callback/github

---

## 🔧 Configuration GitHub App

Pour que GitHub OAuth fonctionne en production, vous devez mettre à jour les **Authorization callback URLs** dans les paramètres de votre GitHub App.

### Étapes

**1. Accédez aux paramètres GitHub App**
- Allez sur [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
- Ou [GitHub Settings → Developer settings → GitHub Apps](https://github.com/settings/apps)

**2. Sélectionnez votre application**
- Cherchez l'app créée pour memoLib (nom: probablement "memoLib" ou "iapostemanager")

**3. Mettez à jour les URLs de callback**

**Option 1: Fly.io uniquement**
```
https://memolib.fly.dev/api/auth/callback/github
```

**Option 2: Netlify uniquement**
```
https://bright-dodol-d4bf9b.netlify.app/api/auth/callback/github
```

**Option 3: Les deux (recommandé pour avoir deux déploiements)**
```
https://memolib.fly.dev/api/auth/callback/github
https://bright-dodol-d4bf9b.netlify.app/api/auth/callback/github
```

**4. Sauvegardez**
- Cliquez sur "Update application"

---

## ✅ Contexte Actuel

| Paramètre | Valeur | Statut |
|-----------|--------|--------|
| **Fly.io URL** | https://memolib.fly.dev | ✅ LIVE (Déployé) |
| **Fly.io Callback** | https://memolib.fly.dev/api/auth/callback/github | ✅ À jour |
| **Netlify URL** | https://bright-dodol-d4bf9b.netlify.app | ✅ LIVE (Déployé) |
| **Netlify Callback** | https://bright-dodol-d4bf9b.netlify.app/api/auth/callback/github | ⏳ **À configurer** |
| **GitHub App ID** | Ov23li9OEdVRtXfo8CE6 | ✅ Configuré |
| **GitHub Secret** | (caché) | ✅ Configuré |
| **NextAuth Secret** | (caché) | ✅ Configuré |

---

## 🧪 Test de Connexion

### Via Netlify
1. Accédez à https://bright-dodol-d4bf9b.netlify.app/fr/login
2. Cliquez sur "Connexion avec GitHub"
3. Autorisez l'application
4. Vous devriez être redirigé vers le dashboard

### Via Fly.io
1. Accédez à https://memolib.fly.dev/fr/login
2. Cliquez sur "Connexion avec GitHub"
3. Autorisez l'application
4. Vous devriez être redirigé vers le dashboard

**Note**: Si l'une des URLs de callback n'est pas enregistrée, GitHub rejettera la demande d'OAuth.

---

## 📝 Variables d'Environnement Vérifiées

### Netlify
✅ DATABASE_URL - Connexion Neon PostgreSQL
✅ NEXTAUTH_SECRET - Clé de chiffrement des sessions
✅ NEXTAUTH_URL - https://bright-dodol-d4bf9b.netlify.app
✅ GITHUB_CLIENT_ID - Ov23li9OEdVRtXfo8CE6
✅ GITHUB_CLIENT_SECRET - ***configuré***
✅ STRIPE_*_KEY - Clés Stripe
✅ SENTRY_DSN - Suivi des erreurs
✅ UPSTASH_REDIS_* - Cache Redis

### Fly.io
✅ Tous les secrets déployés (23 total)
✅ GitHub OAuth testé et fonctionnel

---

## 🚀 Déploiements Actuels

### Fly.io (Main Production)
- **Status**: ✅ 2/2 machines actives, health checks passing
- **Build**: Next.js 16.1.6 Turbopack, image 114 MB
- **Region**: Paris (cdg)
- **URL**: https://memolib.fly.dev

### Netlify (Secondary)
- **Status**: ✅ Déployé et live
- **Build**: Netlify Next.js Runtime v5.15.8
- **URL**: https://bright-dodol-d4bf9b.netlify.app
- **Branch**: main (auto-deploy on push)

---

## 📞 Dépannage

### Si GitHub OAuth ne fonctionne pas sur Netlify

**Étape 1**: Vérifiez que l'URL de callback est enregistrée
→ https://github.com/settings/developers → OAuth Apps → Vérifier

**Étape 2**: Vérifiez que NEXTAUTH_URL est correct
```bash
netlify env:get NEXTAUTH_URL
# Doit afficher: https://bright-dodol-d4bf9b.netlify.app
```

**Étape 3**: Vérifiez les secrets
```bash
netlify env:list | grep GITHUB
# Doit montrer GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET
```

**Étape 4**: Vérifiez les logs Netlify
```bash
netlify logs
```

### Erreur commune : "Invalid redirect_uri"
- Cause: L'URL de callback GitHub n'est pas à jour
- Solution: Mettre à jour sur https://github.com/settings/developers

---

## 🎯 Prochaines Étapes

1. ✅ Vérifier Fly.io → LIVE et fonctionnel
2. ✅ Vérifier Netlify → LIVE et fonctionnel  
3. ⏳ **Mettre à jour GitHub OAuth callback** vers Netlify
4. ⏳ Tester GitHub OAuth sur Netlify
5. ⏳ (Optionnel) Enregistrer custom domain Netlify

---

**Date**: 7 février 2026
**Versions**:
- Next.js: 16.1.6
- Node.js: 20.19.5
- Prisma: 5.22.0
- NextAuth.js 5

