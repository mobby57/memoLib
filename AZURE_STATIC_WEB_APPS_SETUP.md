# 🌐 Azure Static Web Apps - Guide de Déploiement

## ✅ Configuration Complétée

- ✅ Workflow GitHub Actions créé (`.github/workflows/azure-static-web-apps.yml`)
- ✅ Configuration Static Web Apps créée (`staticwebapp.config.json`)
- ✅ Secrets Azure configurés (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)

---

## 🚀 ÉTAPE 1 : Créer la Ressource Azure Static Web Apps

### Option A : Azure Portal (Interface graphique)

1. **Ouvrir Azure Portal**
   ```
   https://portal.azure.com
   ```

2. **Créer une ressource**
   - Rechercher : `Static Web Apps`
   - Cliquer sur `Create`

3. **Configuration de base**
   - **Subscription** : Choisir votre abonnement
   - **Resource Group** : `iapostemanager-rg` (créer si inexistant)
   - **Name** : `iapostemanager-app`
   - **Plan type** : `Free` (pour commencer) ou `Standard` (8€/mois)
   - **Region** : `West Europe` (ou proche de vos utilisateurs)

4. **Deployment details**
   - **Source** : `GitHub`
   - **Organization** : `mobby57`
   - **Repository** : `iapostemanager`
   - **Branch** : `main`

5. **Build Details**
   - **Build Presets** : `Next.js`
   - **App location** : `/`
   - **Api location** : `` (vide)
   - **Output location** : `.next`

6. **Review + Create**
   - Vérifier la configuration
   - Cliquer sur `Create`

7. **⚠️ IMPORTANT : Récupérer le Deployment Token**
   - Une fois créé, aller dans : `Settings` → `Configuration`
   - Copier la valeur de `Deployment token`
   - **Ce token sera utilisé dans l'étape 2**

### Option B : Azure CLI (Ligne de commande)

```bash
# Se connecter à Azure
az login

# Créer le resource group
az group create \
  --name iapostemanager-rg \
  --location westeurope

# Créer Static Web App
az staticwebapp create \
  --name iapostemanager-app \
  --resource-group iapostemanager-rg \
  --source https://github.com/mobby57/iapostemanager \
  --location westeurope \
  --branch main \
  --app-location "/" \
  --output-location ".next" \
  --login-with-github

# Récupérer le deployment token
az staticwebapp secrets list \
  --name iapostemanager-app \
  --resource-group iapostemanager-rg \
  --query "properties.apiKey" \
  --output tsv
```

---

## 🔐 ÉTAPE 2 : Configurer GitHub Secrets

### Secrets Requis

Aller sur : https://github.com/mobby57/iapostemanager/settings/secrets/actions

Ajouter les secrets suivants :

#### 1. AZURE_STATIC_WEB_APPS_API_TOKEN ⚠️ CRITIQUE
```
Nom   : AZURE_STATIC_WEB_APPS_API_TOKEN
Valeur: <coller le deployment token récupéré à l'étape 1>
```

#### 2. DATABASE_URL (Neon PostgreSQL)
```
Nom   : DATABASE_URL
Valeur: postgresql://user:password@hostname/database?sslmode=require
```

#### 3. NEXTAUTH_URL
```
Nom   : NEXTAUTH_URL
Valeur: https://iapostemanager-app.azurestaticapps.net
(Ou votre domaine custom si configuré)
```

#### 4. NEXTAUTH_SECRET
```
Nom   : NEXTAUTH_SECRET
Valeur: <générer une clé aléatoire>
```

Générer avec :
```bash
openssl rand -base64 32
```

#### 5. OLLAMA_BASE_URL (optionnel si IA externe)
```
Nom   : OLLAMA_BASE_URL
Valeur: https://votre-ollama-endpoint.com
```

#### 6. NEXT_PUBLIC_APP_URL
```
Nom   : NEXT_PUBLIC_APP_URL
Valeur: https://iapostemanager-app.azurestaticapps.net
```

---

## ✅ ÉTAPE 3 : Déployer

### Déploiement Automatique

Dès que vous pushez sur `main`, le workflow GitHub Actions se déclenche automatiquement :

```bash
git add .
git commit -m "feat: Configure Azure Static Web Apps deployment"
git push origin main
```

### Suivre le Déploiement

1. **GitHub Actions**
   ```
   https://github.com/mobby57/iapostemanager/actions
   ```
   - Workflow : `Azure Static Web Apps - Production Deployment`
   - Vérifier que tous les jobs passent ✅

2. **Azure Portal**
   - Aller dans votre Static Web App
   - Section `Environments` → `Production`
   - Vérifier le statut du déploiement

---

## 🌐 ÉTAPE 4 : Accéder à l'Application

### URL par défaut Azure
```
https://iapostemanager-app.azurestaticapps.net
```

### Configurer un Domaine Personnalisé (optionnel)

1. Azure Portal → Static Web App → `Custom domains`
2. Cliquer `Add`
3. Entrer votre domaine : `app.iapostemanager.com`
4. Suivre les instructions DNS (CNAME ou TXT record)
5. Valider le domaine

---

## 📊 Monitoring & Diagnostics

### Logs en temps réel
```
Azure Portal → Static Web App → Monitoring → Log stream
```

### Application Insights (recommandé)
```
Azure Portal → Static Web App → Application Insights
Activer → Créer nouvelle ressource
```

### Metrics à surveiller
- Requests per second
- Response time
- Error rate
- Data transfer (bandwidth)

---

## 💰 Coûts Estimés

### Plan Free
- ✅ 100 GB bandwidth/mois
- ✅ 0.5 GB storage
- ✅ 2 custom domains
- ✅ SSL automatique
- ⚠️ Limited staging environments
- **Coût : GRATUIT** 🎉

### Plan Standard
- ✅ 100 GB bandwidth/mois (puis 0.20€/GB)
- ✅ 0.5 GB storage
- ✅ Custom domains illimités
- ✅ Staging environments illimités
- ✅ SLA 99.95%
- **Coût : ~8€/mois**

---

## 🔧 Configuration Avancée

### Variables d'Environnement Runtime

Dans Azure Portal → Static Web App → Configuration :

```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://iapostemanager-app.azurestaticapps.net
NEXTAUTH_SECRET=<votre-secret>
NODE_ENV=production
```

### Staging Environments (Plan Standard)

Chaque Pull Request crée automatiquement un environnement de staging :
```
https://iapostemanager-app-<pr-number>.azurestaticapps.net
```

### Authentification intégrée Azure (optionnel)

Static Web Apps inclut un système d'auth intégré :
```json
// staticwebapp.config.json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/<tenant-id>",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  }
}
```

---

## 🐛 Troubleshooting

### Problème : Build échoue
**Solution** :
```bash
# Tester le build localement
npm run build

# Vérifier les logs GitHub Actions
# Vérifier que tous les secrets sont configurés
```

### Problème : 404 sur toutes les routes
**Solution** :
- Vérifier que `staticwebapp.config.json` contient `navigationFallback`
- Vérifier que `output_location: ".next"` est correct

### Problème : Database connection timeout
**Solution** :
- Vérifier que `DATABASE_URL` est correctement configuré
- Activer SSL mode : `?sslmode=require`
- Vérifier les IP whitelisting dans Neon

### Problème : NextAuth errors
**Solution** :
- Vérifier `NEXTAUTH_URL` correspond à l'URL de production
- Générer un nouveau `NEXTAUTH_SECRET`
- Configurer les callback URLs dans votre provider OAuth

---

## 📚 Ressources

- **Documentation Azure Static Web Apps** : https://learn.microsoft.com/azure/static-web-apps/
- **Next.js sur Azure** : https://learn.microsoft.com/azure/static-web-apps/deploy-nextjs-hybrid
- **Pricing Calculator** : https://azure.microsoft.com/pricing/calculator/
- **Support** : https://portal.azure.com → Support + troubleshooting

---

## ✅ Checklist Finale

- [ ] Ressource Azure Static Web App créée
- [ ] Deployment token récupéré
- [ ] Secret `AZURE_STATIC_WEB_APPS_API_TOKEN` ajouté dans GitHub
- [ ] Secrets de base de données configurés
- [ ] Secrets NextAuth configurés
- [ ] Code pushé sur `main`
- [ ] Workflow GitHub Actions réussi ✅
- [ ] Application accessible sur Azure URL
- [ ] Tests de fonctionnalité OK
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Application Insights activé (recommandé)
- [ ] Monitoring configuré

---

**🎉 Votre application IA Poste Manager est maintenant en production sur Azure Static Web Apps !**
