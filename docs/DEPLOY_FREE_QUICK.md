# 🆓 DÉPLOIEMENT GRATUIT EN 10 MINUTES

## 🎯 Stack 100% Gratuite

```
Vercel (App)     → Gratuit (100GB/mois)
Neon (PostgreSQL) → Gratuit (0.5GB)
Upstash (Redis)   → Gratuit (10K req/jour)
```

**Coût : 0€/mois** 🎉

---

## ⚡ 4 Étapes Rapides

### 1️⃣ Créer les Comptes (3 min)

```
✅ https://vercel.com/signup
✅ https://neon.tech/signup
✅ https://upstash.com/signup
```

### 2️⃣ Configurer Neon (2 min)

1. Créer un projet "iapostemanager"
2. Copier la connection string
3. Garder pour l'étape 4

### 3️⃣ Configurer Upstash (2 min)

1. Créer une base Redis
2. Copier l'URL Redis
3. Garder pour l'étape 4

### 4️⃣ Déployer (3 min)

```powershell
# Dans le dossier du projet
cd c:\Users\moros\Desktop\iaPostemanage

# Exécuter le script
.\scripts\deploy-free.ps1
```

**Le script fait tout automatiquement !**

---

## 🔧 Configuration Manuelle (Alternative)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod

# Ajouter les variables
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Migrations
npx prisma migrate deploy
```

---

## 📋 Variables d'Environnement

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Upstash Redis
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"
REDIS_ENABLED=true

# NextAuth
NEXTAUTH_URL="https://votre-app.vercel.app"
NEXTAUTH_SECRET="généré-automatiquement"

# Ollama (optionnel - API externe)
OLLAMA_BASE_URL="https://api.ollama.com"
```

---

## ✅ Vérification

```bash
# Voir les logs
vercel logs

# Tester l'app
curl https://votre-app.vercel.app

# Lister les déploiements
vercel ls
```

---

## 💡 Limites Gratuites

| Service | Limite | Suffisant pour |
|---------|--------|----------------|
| Vercel | 100GB/mois | 10K visiteurs |
| Neon | 0.5GB | 5K dossiers |
| Upstash | 10K req/jour | 500 users actifs |

**Parfait pour MVP et démo !**

---

## 🚀 Commandes Utiles

```bash
vercel --prod          # Déployer
vercel logs            # Voir logs
vercel ls              # Lister déploiements
vercel env ls          # Lister variables
vercel domains add     # Ajouter domaine
vercel rollback        # Rollback
```

---

## 🎉 Résultat

✅ Application en ligne  
✅ SSL automatique  
✅ CI/CD automatique  
✅ 0€/mois  

**URL : https://votre-app.vercel.app**

---

## 📞 Support

- [Vercel Docs](https://vercel.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Upstash Docs](https://upstash.com/docs)

**Déployez en 10 minutes ! 🚀**
