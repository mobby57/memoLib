# ☁️ Déploiement - Options Disponibles

## 🆓 Option 1 : GRATUIT (Recommandé pour MVP)

### Stack 100% Gratuite
- **Vercel** : Hébergement Next.js
- **Neon** : PostgreSQL (0.5GB)
- **Upstash** : Redis (10K req/jour)

**Coût : 0€/mois**

### Déploiement Rapide

```powershell
# Exécuter le script automatique
.\scripts\deploy-free.ps1
```

📖 **Guide complet :** [DEPLOY_FREE.md](./DEPLOY_FREE.md)  
⚡ **Guide rapide :** [DEPLOY_FREE_QUICK.md](./DEPLOY_FREE_QUICK.md)

---

## 💰 Option 2 : Azure (Production)

### Infrastructure Complète
- **App Service** : Hébergement scalable
- **PostgreSQL** : Base de données managée
- **Redis** : Cache haute performance
- **Blob Storage** : Stockage fichiers
- **Key Vault** : Gestion des secrets

**Coût : ~45€/mois (dev) | ~270€/mois (prod)**

### Déploiement Automatique

```powershell
# Exécuter le script Azure
.\scripts\deploy-azure.ps1 -Environment dev
```

📖 **Guide complet :** [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)  
⚡ **Guide rapide :** [AZURE_QUICK_START.md](./AZURE_QUICK_START.md)

---

## 📊 Comparaison

| Critère | Gratuit (Vercel) | Azure |
|---------|------------------|-------|
| **Coût** | 0€/mois | 45-270€/mois |
| **Setup** | 10 min | 30 min |
| **Scalabilité** | Limitée | Illimitée |
| **Support** | Community | Enterprise |
| **Idéal pour** | MVP, Démo | Production |

---

## 🎯 Quelle Option Choisir ?

### Choisir GRATUIT si :
- ✅ Vous démarrez (MVP/Démo)
- ✅ Budget limité
- ✅ < 500 utilisateurs
- ✅ Déploiement rapide

### Choisir Azure si :
- ✅ Application en production
- ✅ > 500 utilisateurs
- ✅ Besoin de scalabilité
- ✅ Support entreprise requis

---

## 🚀 Démarrage Rapide

### Option Gratuite (10 min)

```powershell
# 1. Créer les comptes
# - Vercel : https://vercel.com/signup
# - Neon : https://neon.tech/signup
# - Upstash : https://upstash.com/signup

# 2. Déployer
cd c:\Users\moros\Desktop\iaPostemanage
.\scripts\deploy-free.ps1
```

### Option Azure (30 min)

```powershell
# 1. Installer Azure CLI
winget install -e --id Microsoft.AzureCLI
az login

# 2. Déployer
cd c:\Users\moros\Desktop\iaPostemanage
.\scripts\deploy-azure.ps1 -Environment dev
```

---

## 📚 Documentation Complète

### Déploiement Gratuit
- 📖 [Guide Complet](./DEPLOY_FREE.md)
- ⚡ [Guide Rapide](./DEPLOY_FREE_QUICK.md)
- 🔧 [Script PowerShell](../scripts/deploy-free.ps1)

### Déploiement Azure
- 📖 [Guide Complet](./AZURE_DEPLOYMENT.md)
- ⚡ [Guide Rapide](./AZURE_QUICK_START.md)
- 🔧 [Script PowerShell](../scripts/deploy-azure.ps1)
- 🤖 [GitHub Actions](../.github/workflows/azure-deploy.yml)

---

## ✅ Checklist de Déploiement

### Avant de Déployer
- [ ] Code testé localement
- [ ] Variables d'environnement préparées
- [ ] Base de données prête
- [ ] Comptes créés (Vercel/Azure)

### Après le Déploiement
- [ ] Application accessible
- [ ] Migrations exécutées
- [ ] Tests fonctionnels OK
- [ ] Monitoring activé
- [ ] CI/CD configuré

---

## 🆘 Support

### Problèmes Courants

**App ne démarre pas**
```bash
# Vercel
vercel logs

# Azure
az webapp log tail --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev
```

**Base de données inaccessible**
- Vérifier la connection string
- Vérifier les règles de firewall
- Tester la connexion locale

**Variables manquantes**
```bash
# Vercel
vercel env ls

# Azure
az webapp config appsettings list --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev
```

---

## 🎉 Conclusion

**Pour démarrer rapidement : Utilisez l'option GRATUITE**

```powershell
.\scripts\deploy-free.ps1
```

**Pour la production : Passez à Azure**

```powershell
.\scripts\deploy-azure.ps1 -Environment prod
```

**Déployez en 10 minutes ! 🚀**
