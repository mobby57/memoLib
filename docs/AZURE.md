# 🚀 Déploiement Azure - memoLib

## 📋 Vue d'ensemble

L'application est déployée sur **Azure App Service** (Linux, Node.js 20).

| Ressource | Valeur |
|-----------|--------|
| **URL Production** | https://memoLib-app.azurewebsites.net |
| **App Service** | memoLib-app |
| **Resource Group** | memoLib-rg |
| **Region** | West Europe |
| **Plan** | F1 (Free) |
| **Runtime** | Node.js 20 LTS |

---

## 🔧 Configuration requise

### 1. Secret GitHub Actions

Le secret `AZURE_CREDENTIALS` doit contenir un JSON de Service Principal :

```json
{
  "clientId": "<app-id>",
  "clientSecret": "<password>",
  "subscriptionId": "<subscription-id>",
  "tenantId": "<tenant-id>"
}
```

**Créer un nouveau Service Principal :**
```bash
az ad sp create-for-rbac \
  --name "memoLib-deploy" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/memoLib-rg \
  --sdk-auth
```

### 2. Variables d'environnement App Service

Configurer dans Azure Portal → App Service → Configuration → Application settings :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL Neon avec `?sslmode=require` |
| `NEXTAUTH_URL` | `https://memoLib-app.azurewebsites.net` |
| `NEXTAUTH_SECRET` | Secret 32+ caractères pour les sessions |
| `NODE_ENV` | `production` |
| `GITHUB_CLIENT_ID` | OAuth GitHub (optionnel) |
| `GITHUB_CLIENT_SECRET` | OAuth GitHub (optionnel) |

**Commande CLI :**
```bash
az webapp config appsettings set \
  --name memoLib-app \
  --resource-group memoLib-rg \
  --settings \
    DATABASE_URL="postgresql://..." \
    NEXTAUTH_URL="https://memoLib-app.azurewebsites.net" \
    NEXTAUTH_SECRET="votre-secret-32-chars" \
    NODE_ENV="production"
```

---

## 🚀 Déploiement

### Automatique (CI/CD)

Chaque push sur `main` déclenche le workflow `.github/workflows/azure-deploy.yml`.

### Manuel

```bash
# Déclencher manuellement
gh workflow run "azure-deploy.yml" --ref main

# Suivre l'exécution
gh run watch
```

---

## 🔍 Diagnostic

### Voir les logs

```bash
# Logs en temps réel
az webapp log tail --name memoLib-app --resource-group memoLib-rg

# Télécharger les logs
az webapp log download --name memoLib-app --resource-group memoLib-rg --log-file logs.zip
```

### Redémarrer l'application

```bash
az webapp restart --name memoLib-app --resource-group memoLib-rg
```

### Vérifier la configuration

```bash
# Voir les app settings
az webapp config appsettings list --name memoLib-app --resource-group memoLib-rg -o table

# Voir la commande de démarrage
az webapp config show --name memoLib-app --resource-group memoLib-rg --query "appCommandLine"
```

---

## ⚠️ Limitations connues

1. **Cold Start** : Le plan F1 (gratuit) peut prendre 30-60s au premier démarrage
2. **Timeout** : Les requêtes sont limitées à 230 secondes
3. **Stockage** : 1 GB sur le plan gratuit

---

## 🔄 Alternatives de déploiement

| Plateforme | Status | Notes |
|------------|--------|-------|
| **Vercel** | ✅ Actif | https://memoLib.vercel.app |
| **Azure App Service** | 🔧 Configuration | Ce document |
| **Azure SWA** | ❌ Abandonné | Incompatible avec Prisma + SSR complexe |

---

## 📁 Fichiers de configuration

```
.github/workflows/azure-deploy.yml  # Workflow CI/CD unique
docs/AZURE.md                       # Cette documentation
```

---

*Dernière mise à jour : Janvier 2026*
