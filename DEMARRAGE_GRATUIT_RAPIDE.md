# 🎁 DÉMARRAGE GRATUIT RAPIDE - IA Poste Manager

## ✅ Configuration Locale Terminée !

Votre application fonctionne maintenant en **100% GRATUIT** avec SQLite !

---

## 🚀 Accès à l'Application

**URL Locale :** http://localhost:3000

### 🔐 Comptes de Démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Super Admin** | superadmin@demo.com | demo123 |
| **Admin (Avocat)** | admin@demo.com | demo123 |
| **Client 1** | client1@demo.com | demo123 |
| **Client 2** | client2@demo.com | demo123 |
| **Client 3** | client3@demo.com | demo123 |

---

## 📊 Données de Démo Incluses

✅ **3 Clients** avec profils complets  
✅ **9 Dossiers CESEDA** (OQTF, Naturalisation, Asile)  
✅ **Documents** et échéances  
✅ **Multi-tenant** - Cabinet Démo configuré  

---

## 💰 Options de Déploiement GRATUIT

### Option 1: Vercel (Recommandée) ⭐

**100% Gratuit + PostgreSQL 256 MB inclus**

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Déployer
vercel

# 3. Ajouter PostgreSQL gratuit
# → Dashboard Vercel → Storage → Create Database → Postgres

# 4. Connecter la DB
vercel env pull .env.production
npx prisma db push --preview-feature
```

**Coût :** 0€ (Hobby Plan)  
**Temps :** 5 minutes  

---

### Option 2: Cloudflare Pages (100% Gratuit)

**Déjà configuré dans ce projet !**

```bash
# 1. Se connecter
npx wrangler login

# 2. Créer la base D1 (SQLite global)
npx wrangler d1 create iapostemanager-db

# 3. Copier l'ID et mettre à jour wrangler.toml
# database_id = "VOTRE_ID_ICI"

# 4. Migrer la base
npm run db:migrate:d1

# 5. Déployer
npm run deploy:cloudflare
```

**Coût :** 0€ (limites généreuses)  
**Temps :** 10 minutes  

Voir [docs/CLOUDFLARE_QUICKSTART.md](../docs/CLOUDFLARE_QUICKSTART.md)

---

### Option 3: Railway.app

**$5 crédit gratuit/mois**

```bash
npm install -g @railway/cli
railway login
railway init
railway add --plugin postgresql
railway up
```

**Coût :** $5 crédit/mois (renouvelable)  
**Temps :** 8 minutes  

---

## 📈 Comparaison Rapide

| Critère | Vercel | Cloudflare | Railway |
|---------|--------|------------|---------|
| **Gratuit** | ✅ Permanent | ✅ Permanent | ⚠️ $5/mois |
| **PostgreSQL** | ✅ 256 MB | ❌ (SQLite D1) | ✅ 1 GB |
| **Déploiement** | ⚡ 2 min | 🔧 10 min | ⚡ 5 min |
| **Complexité** | 🟢 Facile | 🟡 Moyen | 🟢 Facile |
| **Bande passante** | 100 GB/mois | ♾️ Illimité | Inclus |
| **Recommandation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🔧 Commandes Utiles

### Base de Données

```bash
# Voir les données
npx prisma studio

# Réinitialiser la DB
npx prisma db push --force-reset

# Recharger les données de démo
npm run db:seed:complete

# Ouvrir Prisma Studio
npm run db:studio
```

### Développement

```bash
# Démarrer le serveur dev
npm run dev

# Build production
npm run build

# Tester le build
npm start
```

---

## 🎯 Prochaines Étapes

### 1. Tester l'Application Localement

1. Ouvrir http://localhost:3000
2. Se connecter avec `admin@demo.com` / `demo123`
3. Explorer les fonctionnalités :
   - 📁 Gestion dossiers CESEDA
   - 👥 Clients et profils
   - ⏰ Échéances et alertes
   - 🤖 Système IA (avec Ollama local)
   - 📧 Monitoring emails (configuration requise)

### 2. Déployer sur Vercel (5 minutes)

```bash
# Installation + déploiement en une commande
npm install -g vercel && vercel
```

Puis suivre [docs/DEPLOYMENT_GRATUIT.md](../docs/DEPLOYMENT_GRATUIT.md) section Vercel

### 3. Configurer Ollama (IA Locale - Optionnel)

```bash
# Installer Ollama
# https://ollama.ai

# Télécharger le modèle
ollama pull llama3.2:3b

# Tester la connexion
npx tsx scripts/test-ollama.ts
```

### 4. Passer en Production

Quand vous serez prêt, consultez :
- [docs/CLOUDFLARE_COMPLETE.md](../docs/CLOUDFLARE_COMPLETE.md) - Guide complet Cloudflare
- [docs/AZURE_DEPLOYMENT.md](../docs/AZURE_DEPLOYMENT.md) - Déploiement Azure Enterprise
- [docs/CLOUD_COMPARISON.md](../docs/CLOUD_COMPARISON.md) - Comparaison des plateformes

---

## ⚡ Déploiement Express (1 ligne)

### Vercel
```bash
npx vercel
```

### Cloudflare
```bash
npx wrangler pages deploy .vercel/output/static
```

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| [DEPLOYMENT_GRATUIT.md](../docs/DEPLOYMENT_GRATUIT.md) | Guide complet déploiement gratuit |
| [CLOUDFLARE_INDEX.md](../docs/CLOUDFLARE_INDEX.md) | Index Cloudflare |
| [docs/README.md](../docs/README.md) | Index complet documentation |

---

## 🆘 Problèmes Courants

### Port 3000 déjà utilisé
```bash
npm run dev -- -p 3001
```

### Base de données verrouillée
```bash
# Fermer tous les terminaux
# Supprimer dev.db et dev.db-journal
rm dev.db dev.db-journal
npx prisma db push
npm run db:seed:complete
```

### Variables d'environnement manquantes
```bash
# Vérifier que DATABASE_URL est dans .env
cat .env | grep DATABASE_URL

# Régénérer le client Prisma
npx prisma generate
```

---

## 🎉 Félicitations !

Vous avez maintenant une application juridique IA complète qui fonctionne **100% gratuitement** en local avec SQLite !

**Prochaine étape recommandée :**  
👉 Testez l'application → Déployez sur Vercel (gratuit) → Ajoutez Ollama pour l'IA locale !

---

**Support :** Consultez [docs/README.md](../docs/README.md) pour la documentation complète  
**Version :** 2.0.0 - Janvier 2026
