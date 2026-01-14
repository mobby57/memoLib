# 🚀 Cloudflare - Démarrage Rapide en 5 Minutes

## ⚡ Installation & Déploiement Express

**Temps estimé:** 5-10 minutes  
**Prérequis:** Compte Cloudflare (gratuit)

---

## 📋 Étape 1 : Installation (2 min)

### Windows PowerShell

```powershell
# 1. Installer Wrangler CLI
npm install -g wrangler

# 2. Se connecter à Cloudflare
wrangler login

# 3. Vérifier la connexion
wrangler whoami
```

**✅ Vous devriez voir votre email Cloudflare**

---

## 🗄️ Étape 2 : Créer la Base D1 (1 min)

```powershell
# Créer la base de données
wrangler d1 create iaposte-production-db

# Copier le database_id affiché et le mettre dans wrangler.toml
# Exemple de sortie :
# [[d1_databases]]
# binding = "DB"
# database_name = "iaposte-production-db"
# database_id = "COPIEZ_CET_ID_ICI"
```

**📝 Action requise:** Ouvrez `wrangler.toml` et collez le `database_id`

---

## 💾 Étape 3 : Migration de la Base (1 min)

```powershell
# Exécuter le script de migration
.\scripts\migrate-to-d1.ps1
```

**✅ Ce script va:**
1. Générer le schéma SQL depuis Prisma
2. Créer toutes les tables dans D1
3. Insérer les données initiales

---

## 🏗️ Étape 4 : Build & Deploy (2 min)

```powershell
# Option A : Déploiement automatique complet
.\deploy-cloudflare-full.ps1

# Option B : Étapes manuelles
npm run build
wrangler pages deploy out --project-name=iaposte-manager
```

**🎉 Votre application est en ligne!**

L'URL sera affichée dans le terminal :
```
https://iaposte-manager.pages.dev
```

---

## 🔑 Étape 5 : Configurer les Secrets (2 min)

```powershell
# Générer un secret NextAuth (PowerShell)
$secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
Write-Host $secret

# Ajouter les secrets
wrangler pages secret put NEXTAUTH_SECRET --project-name=iaposte-manager
# Coller le secret généré ci-dessus

wrangler pages secret put NEXTAUTH_URL --project-name=iaposte-manager
# Entrer: https://iaposte-manager.pages.dev

wrangler pages secret put DATABASE_URL --project-name=iaposte-manager  
# Entrer: d1://DATABASE_ID (remplacer DATABASE_ID)
```

---

## ✅ Vérification Finale

### Test de l'Application

```powershell
# 1. Vérifier la santé de l'API
Invoke-WebRequest -Uri "https://iaposte-manager.pages.dev/api/health"

# 2. Tester la base D1
wrangler d1 execute iaposte-production-db --command "SELECT COUNT(*) FROM User" --remote

# 3. Voir les logs en temps réel
wrangler pages deployment tail --project-name=iaposte-manager
```

---

## 📊 Dashboard Cloudflare

Ouvrez [Cloudflare Dashboard](https://dash.cloudflare.com) pour:

- 📈 Voir les analytics
- 🔍 Consulter les logs
- ⚙️ Gérer les settings
- 🌐 Configurer un domaine personnalisé

---

## 🎯 Commandes Essentielles

```powershell
# Déploiement
.\deploy-cloudflare-full.ps1

# Migration D1
.\scripts\migrate-to-d1.ps1

# Backup
.\backup-cloudflare.ps1

# Logs en temps réel
wrangler pages deployment tail --project-name=iaposte-manager

# Query D1
wrangler d1 execute iaposte-production-db --command "SELECT * FROM User LIMIT 5" --remote
```

---

## 🆘 Problèmes Fréquents

### ❌ "wrangler: command not found"

```powershell
npm install -g wrangler
```

### ❌ "Database not found"

Vérifiez que le `database_id` dans `wrangler.toml` est correct.

### ❌ Build échoue

```powershell
# Nettoyer et réinstaller
rm -r node_modules, package-lock.json
npm install
npm run build
```

### ❌ Secrets non reconnus

```powershell
# Lister les secrets
wrangler pages secret list --project-name=iaposte-manager

# Recréer si besoin
wrangler pages secret delete NEXTAUTH_SECRET --project-name=iaposte-manager
wrangler pages secret put NEXTAUTH_SECRET --project-name=iaposte-manager
```

---

## 🎁 Bonus : CI/CD GitHub Actions

Le workflow est déjà configuré dans `.github/workflows/cloudflare-pages.yml`

**Ajouter les secrets GitHub:**

1. GitHub → Settings → Secrets and variables → Actions
2. Ajouter :
   - `CLOUDFLARE_API_TOKEN` (créer sur https://dash.cloudflare.com/profile/api-tokens)
   - `CLOUDFLARE_ACCOUNT_ID` (visible sur le Dashboard)
   - `DATABASE_URL` (format: `d1://DATABASE_ID`)
   - `NEXTAUTH_SECRET`

**Push sur main = Déploiement auto! 🚀**

---

## 💰 Tarification

| Service | Gratuit | Prix Paid |
|---------|---------|-----------|
| Pages | 500 builds/mois | Illimité ($5/mois) |
| D1 | 5 GB + 5M reads/jour | 50 GB ($5/mois) |
| R2 | 10 GB | $0.015/GB |
| Bandwidth | Illimité | Illimité |

**Coût estimé production:** $5-15/mois (vs $50-300/mois sur Azure/AWS)

---

## 📚 Documentation

- [Guide Complet](./CLOUDFLARE_COMPLETE.md) - Toutes les fonctionnalités
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)

---

## 🎉 Félicitations!

Votre application **IA Poste Manager** est maintenant déployée sur Cloudflare! 🚀

**Prochaines étapes:**
1. ✅ Tester l'application sur l'URL `.pages.dev`
2. 🌐 Configurer un domaine personnalisé (optionnel)
3. 📊 Activer Web Analytics
4. 🔒 Configurer Cloudflare Access (optionnel)
5. 🤖 Activer Workers AI pour l'IA à la edge (optionnel)

**Besoin d'aide?** Consultez [CLOUDFLARE_COMPLETE.md](./CLOUDFLARE_COMPLETE.md) pour le guide détaillé.
