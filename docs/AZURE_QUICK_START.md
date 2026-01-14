# 🚀 Quick Start - Déploiement Azure

## En 5 Minutes ⚡

### Prérequis

- ✅ Compte Azure actif
- ✅ Azure CLI installé
- ✅ Git configuré

---

## 🎯 Déploiement Automatique

### Option 1 : Script PowerShell (Recommandé)

```powershell
# 1. Ouvrir PowerShell dans le dossier du projet
cd c:\Users\moros\Desktop\iaPostemanage

# 2. Exécuter le script de déploiement
.\scripts\deploy-azure.ps1 -Environment dev

# 3. Attendre 10-15 minutes (création des ressources)

# 4. Déployer le code
git remote add azure <URL_GIT_AZURE>
git push azure main

# 5. Exécuter les migrations
.\scripts\azure-migrate.ps1 -Environment dev
```

**C'est tout ! 🎉**

---

## 📋 Commandes Essentielles

### Déploiement

```powershell
# Déploiement dev
.\scripts\deploy-azure.ps1 -Environment dev

# Déploiement prod
.\scripts\deploy-azure.ps1 -Environment prod

# Déployer uniquement l'app (skip infrastructure)
.\scripts\deploy-azure.ps1 -DeployAppOnly
```

### Migrations

```powershell
# Migrer la base de données
.\scripts\azure-migrate.ps1 -Environment dev
```

### Monitoring

```powershell
# Voir les logs en temps réel
az webapp log tail --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev

# Redémarrer l'app
az webapp restart --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev

# Voir les variables d'environnement
az webapp config appsettings list --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev
```

---

## 🔐 Configuration GitHub Actions (CI/CD)

### 1. Récupérer le Publish Profile

```powershell
az webapp deployment list-publishing-profiles `
  --resource-group rg-iapostemanager-dev `
  --name app-iapostemanager-dev `
  --xml > publish-profile.xml
```

### 2. Ajouter les Secrets GitHub

Aller sur GitHub → Settings → Secrets → Actions → New repository secret

| Secret Name | Valeur |
|-------------|--------|
| `AZURE_WEBAPP_NAME` | `app-iapostemanager-dev` |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Contenu de `publish-profile.xml` |
| `DATABASE_URL` | Depuis `azure-credentials-dev.txt` |
| `NEXTAUTH_SECRET` | Générer avec `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://app-iapostemanager-dev.azurewebsites.net` |

### 3. Push vers GitHub

```bash
git add .
git commit -m "Configure Azure deployment"
git push origin main
```

**Le déploiement se fait automatiquement ! 🚀**

---

## 📊 Vérification Post-Déploiement

### Checklist

```powershell
# 1. Vérifier que l'app est accessible
curl https://app-iapostemanager-dev.azurewebsites.net

# 2. Vérifier les logs
az webapp log tail --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev

# 3. Tester l'API health
curl https://app-iapostemanager-dev.azurewebsites.net/api/health

# 4. Vérifier la base de données
# Se connecter via Azure Portal ou pgAdmin
```

---

## 💰 Coûts Estimés

### Environnement Dev

| Service | Prix/mois |
|---------|-----------|
| App Service B1 | ~13€ |
| PostgreSQL B1ms | ~15€ |
| Redis Basic C0 | ~17€ |
| Storage 10GB | ~0.50€ |
| **TOTAL** | **~45€** |

### Environnement Prod

| Service | Prix/mois |
|---------|-----------|
| App Service P1V2 | ~75€ |
| PostgreSQL 2vCore | ~120€ |
| Redis Standard C1 | ~60€ |
| Storage 100GB | ~5€ |
| CDN | ~10€ |
| **TOTAL** | **~270€** |

---

## 🆘 Dépannage

### Problème : Déploiement échoue

```powershell
# Vérifier les logs
az webapp log tail --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev

# Redémarrer l'app
az webapp restart --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev
```

### Problème : Base de données inaccessible

```powershell
# Vérifier les règles de firewall
az postgres flexible-server firewall-rule list `
  --resource-group rg-iapostemanager-dev `
  --name psql-iapostemanager-dev

# Ajouter votre IP
az postgres flexible-server firewall-rule create `
  --resource-group rg-iapostemanager-dev `
  --name psql-iapostemanager-dev `
  --rule-name MyIP `
  --start-ip-address <VOTRE_IP> `
  --end-ip-address <VOTRE_IP>
```

### Problème : Variables d'environnement manquantes

```powershell
# Lister les variables
az webapp config appsettings list `
  --resource-group rg-iapostemanager-dev `
  --name app-iapostemanager-dev

# Ajouter une variable
az webapp config appsettings set `
  --resource-group rg-iapostemanager-dev `
  --name app-iapostemanager-dev `
  --settings KEY=VALUE
```

---

## 📚 Ressources

- 📖 [Documentation complète](./AZURE_DEPLOYMENT.md)
- 🔧 [Script de déploiement](../scripts/deploy-azure.ps1)
- 🔄 [Script de migration](../scripts/azure-migrate.ps1)
- 🤖 [GitHub Actions](./.github/workflows/azure-deploy.yml)

---

## ✅ Checklist Finale

- [ ] Azure CLI installé et connecté
- [ ] Script de déploiement exécuté
- [ ] Ressources créées (App Service, PostgreSQL, Redis, Storage)
- [ ] Code déployé
- [ ] Migrations exécutées
- [ ] Application accessible
- [ ] GitHub Actions configuré (optionnel)
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Monitoring activé

---

## 🎉 Félicitations !

Votre application **IA Poste Manager** est maintenant en production sur Azure ! 🚀

**URL :** https://app-iapostemanager-dev.azurewebsites.net

**Support :** Consultez la [documentation complète](./AZURE_DEPLOYMENT.md) pour plus d'informations.
