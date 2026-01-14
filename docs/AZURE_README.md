# ☁️ Azure - Documentation Complète

## 📚 Index des Documents

### 🚀 Démarrage Rapide
- **[AZURE_QUICK_START.md](./AZURE_QUICK_START.md)** - Déploiement en 5 minutes
  - Installation Azure CLI
  - Commandes essentielles
  - Configuration CI/CD
  - Dépannage rapide

### 📖 Documentation Complète
- **[AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)** - Guide détaillé complet
  - Architecture Azure recommandée
  - 11 étapes de déploiement détaillées
  - Configuration de tous les services
  - Monitoring et sécurité
  - Estimation des coûts

---

## 🛠️ Scripts Disponibles

### PowerShell

| Script | Description | Usage |
|--------|-------------|-------|
| `scripts/deploy-azure.ps1` | Déploiement automatique complet | `.\scripts\deploy-azure.ps1 -Environment dev` |
| `scripts/azure-migrate.ps1` | Migration Prisma vers Azure | `.\scripts\azure-migrate.ps1 -Environment dev` |

### GitHub Actions

| Workflow | Description | Trigger |
|----------|-------------|---------|
| `.github/workflows/azure-deploy.yml` | CI/CD automatique | Push sur `main` ou `develop` |

---

## 📦 Services Azure Déployés

### Infrastructure

```
┌─────────────────────────────────────────┐
│  🌐 App Service (Next.js)               │
│  🗄️  PostgreSQL Flexible Server         │
│  🔴 Azure Cache for Redis               │
│  📁 Blob Storage                         │
│  🔐 Key Vault                            │
│  📊 Application Insights                 │
└─────────────────────────────────────────┘
```

### Environnements

| Environnement | Resource Group | URL |
|---------------|----------------|-----|
| **Dev** | `rg-iapostemanager-dev` | `https://app-iapostemanager-dev.azurewebsites.net` |
| **Prod** | `rg-iapostemanager-prod` | `https://app-iapostemanager-prod.azurewebsites.net` |

---

## 🎯 Déploiement en 3 Étapes

### 1️⃣ Installer Azure CLI

```powershell
winget install -e --id Microsoft.AzureCLI
az login
```

### 2️⃣ Déployer l'Infrastructure

```powershell
cd c:\Users\moros\Desktop\iaPostemanage
.\scripts\deploy-azure.ps1 -Environment dev
```

**Durée :** 10-15 minutes

### 3️⃣ Déployer le Code

```powershell
# Option A : Git
git remote add azure <URL_GIT_AZURE>
git push azure main

# Option B : GitHub Actions (automatique)
git push origin main
```

**C'est tout ! 🎉**

---

## 💰 Coûts Mensuels

### Développement (~45€/mois)

| Service | SKU | Prix |
|---------|-----|------|
| App Service | B1 | ~13€ |
| PostgreSQL | B1ms | ~15€ |
| Redis | Basic C0 | ~17€ |
| Storage | 10GB | ~0.50€ |

### Production (~270€/mois)

| Service | SKU | Prix |
|---------|-----|------|
| App Service | P1V2 | ~75€ |
| PostgreSQL | 2vCore | ~120€ |
| Redis | Standard C1 | ~60€ |
| Storage | 100GB | ~5€ |
| CDN | Standard | ~10€ |

---

## 🔧 Commandes Utiles

### Monitoring

```powershell
# Logs en temps réel
az webapp log tail --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev

# Redémarrer l'app
az webapp restart --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev

# Status de l'app
az webapp show --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev
```

### Base de Données

```powershell
# Lister les backups
az postgres flexible-server backup list --resource-group rg-iapostemanager-dev --name psql-iapostemanager-dev

# Créer un backup
az postgres flexible-server backup create --resource-group rg-iapostemanager-dev --name psql-iapostemanager-dev --backup-name backup-$(Get-Date -Format "yyyyMMdd")

# Exécuter les migrations
.\scripts\azure-migrate.ps1 -Environment dev
```

### Configuration

```powershell
# Lister les variables d'environnement
az webapp config appsettings list --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev

# Ajouter une variable
az webapp config appsettings set --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev --settings KEY=VALUE

# Voir les connection strings
az webapp config connection-string list --resource-group rg-iapostemanager-dev --name app-iapostemanager-dev
```

---

## 🔐 Sécurité

### Checklist

- ✅ HTTPS obligatoire activé
- ✅ Managed Identity configurée
- ✅ Key Vault pour les secrets
- ✅ Firewall PostgreSQL configuré
- ✅ Redis SSL/TLS activé
- ✅ Storage encryption at rest
- ✅ Application Insights pour monitoring

### Secrets Management

Tous les secrets sont stockés dans **Azure Key Vault** :
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `REDIS_URL`
- `STORAGE_CONNECTION_STRING`

Accès via **Managed Identity** (pas de credentials en dur).

---

## 📊 Monitoring

### Application Insights

- **Logs** : Tous les logs applicatifs
- **Métriques** : CPU, RAM, requêtes/sec
- **Traces** : Requêtes HTTP, dépendances
- **Exceptions** : Erreurs en temps réel
- **Alertes** : Notifications automatiques

### Accès

1. Aller sur [Azure Portal](https://portal.azure.com)
2. Rechercher `appi-iapostemanager-dev`
3. Voir les dashboards et métriques

---

## 🆘 Support

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| App ne démarre pas | Vérifier les logs : `az webapp log tail ...` |
| DB inaccessible | Vérifier firewall : `az postgres flexible-server firewall-rule list ...` |
| Variables manquantes | Ajouter : `az webapp config appsettings set ...` |
| Build échoue | Vérifier `package.json` et dépendances |

### Ressources

- 📖 [Documentation Azure](https://docs.microsoft.com/azure/)
- 💬 [Stack Overflow](https://stackoverflow.com/questions/tagged/azure)
- 🎓 [Microsoft Learn](https://learn.microsoft.com/azure/)
- 📧 [Support Azure](https://azure.microsoft.com/support/)

---

## 🎓 Formation

### Tutoriels Recommandés

1. **Azure Fundamentals** (2h)
   - Concepts de base
   - Resource Groups
   - App Service

2. **Azure Database for PostgreSQL** (1h)
   - Configuration
   - Backup/Restore
   - Performance tuning

3. **CI/CD avec GitHub Actions** (1h)
   - Workflows
   - Secrets
   - Déploiement automatique

---

## 📈 Roadmap

### Phase 1 : Déploiement Initial ✅
- [x] Infrastructure Azure
- [x] Déploiement automatisé
- [x] CI/CD GitHub Actions
- [x] Documentation complète

### Phase 2 : Optimisation (À venir)
- [ ] CDN pour assets statiques
- [ ] Auto-scaling avancé
- [ ] Backup automatique quotidien
- [ ] Disaster recovery plan

### Phase 3 : Production (À venir)
- [ ] Domaine personnalisé
- [ ] Certificat SSL custom
- [ ] Multi-région
- [ ] Load balancing

---

## ✅ Checklist de Déploiement

### Avant le Déploiement

- [ ] Compte Azure actif
- [ ] Azure CLI installé
- [ ] Git configuré
- [ ] Variables d'environnement préparées
- [ ] Code testé localement

### Pendant le Déploiement

- [ ] Script `deploy-azure.ps1` exécuté
- [ ] Toutes les ressources créées
- [ ] Variables d'environnement configurées
- [ ] Code déployé
- [ ] Migrations exécutées

### Après le Déploiement

- [ ] Application accessible
- [ ] API fonctionne
- [ ] Base de données connectée
- [ ] Redis fonctionne
- [ ] Logs visibles
- [ ] Monitoring actif
- [ ] GitHub Actions configuré

---

## 🎉 Conclusion

Vous disposez maintenant d'une **infrastructure Azure complète et production-ready** pour **IA Poste Manager** !

### Prochaines Étapes

1. 📖 Lire [AZURE_QUICK_START.md](./AZURE_QUICK_START.md)
2. 🚀 Exécuter `.\scripts\deploy-azure.ps1`
3. ✅ Vérifier le déploiement
4. 🔄 Configurer GitHub Actions
5. 📊 Monitorer l'application

**Besoin d'aide ?** Consultez la [documentation complète](./AZURE_DEPLOYMENT.md) !

---

**Dernière mise à jour :** $(Get-Date -Format "dd/MM/yyyy")  
**Version :** 1.0.0  
**Auteur :** IA Poste Manager Team
