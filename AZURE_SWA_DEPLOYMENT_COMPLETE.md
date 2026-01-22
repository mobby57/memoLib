# ✅ Azure Static Web Apps - Déploiement Complet

**Date:** 22 janvier 2026  
**Status:** ✅ Créé avec succès  
**URL Production:** https://agreeable-desert-0d1659d03.6.azurestaticapps.net

---

## 🎯 Ressources Créées

### Azure Static Web App

- **Nom:** iapostemanager-swa
- **Resource Group:** iapostemanager-rg
- **Location:** West Europe
- **SKU:** Free
- **Provider:** GitHub
- **Repository:** https://github.com/mobby57/iapostemanager
- **Branch:** main

### URLs

- **Production:** https://agreeable-desert-0d1659d03.6.azurestaticapps.net
- **CDN Endpoint:** https://content-am2.infrastructure.6.azurestaticapps.net

---

## 🔧 Configuration GitHub Actions

### Fichier Créé

`.github/workflows/azure-swa-deploy.yml`

### Secrets Requis

Ajoutez ces secrets dans **GitHub Repository Settings > Secrets and variables > Actions** :

1. **AZURE_STATIC_WEB_APPS_API_TOKEN** ⚠️ **REQUIS**
   - Récupéré via: `az staticwebapp secrets list --name iapostemanager-swa --resource-group iapostemanager-rg --query "properties.apiKey" -o tsv`
   - Copier le token complet affiché dans le terminal

2. **NEXTAUTH_SECRET**
   - Générer via: `openssl rand -base64 32`

3. **DATABASE_URL**
   - Format: `file:./prisma/dev.db` (SQLite)
   - Ou PostgreSQL: `postgresql://user:pass@host:5432/db`

4. **OLLAMA_BASE_URL** (optionnel)
   - URL du serveur Ollama pour l'IA locale
   - Défaut: `http://localhost:11434`

---

## 📋 Étapes de Déploiement

### 1. Ajouter le Token Azure à GitHub

```bash
# Sur https://github.com/mobby57/iapostemanager/settings/secrets/actions
# Cliquer "New repository secret"
# Nom: AZURE_STATIC_WEB_APPS_API_TOKEN
# Valeur: [copier le token du terminal]
```

### 2. Ajouter les Autres Secrets

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# DATABASE_URL
echo "file:./prisma/dev.db"
```

### 3. Commit et Push

```bash
git add .github/workflows/azure-swa-deploy.yml
git add staticwebapp.config.json
git commit -m "feat: Azure Static Web Apps deployment"
git push origin main
```

### 4. Vérifier le Déploiement

- **GitHub Actions:** https://github.com/mobby57/iapostemanager/actions
- **Azure Portal:** https://portal.azure.com/#@/resource/subscriptions/03b6b7fe-90b8-4fa5-ae31-24cd21958add/resourceGroups/iapostemanager-rg/providers/Microsoft.Web/staticSites/iapostemanager-swa

---

## 🚀 Pipeline CI/CD

### Déclencheurs

- **Push sur `main`** → Déploiement production
- **Pull Request** → Environnement de prévisualisation
- **PR fermée** → Suppression environnement prévisualisation

### Étapes de Build

1. ✅ Checkout du code
2. ✅ Setup Node.js 20
3. ✅ Installation dépendances (`npm ci`)
4. ✅ Génération Prisma Client
5. ✅ Build Next.js
6. ✅ Déploiement vers Azure

---

## 🔐 Sécurité

### Headers Configurés

- ✅ Content-Security-Policy
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy

### Configuration Routes

```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

---

## 📊 Monitoring

### Azure Portal

```bash
# Ouvrir dans Azure Portal
az staticwebapp show --name iapostemanager-swa --resource-group iapostemanager-rg --query "id" -o tsv | xargs -I {} echo "https://portal.azure.com/#@/resource{}"
```

### Logs GitHub Actions

```bash
# Voir les logs du dernier workflow
gh run list --repo mobby57/iapostemanager --limit 1
gh run view --repo mobby57/iapostemanager
```

---

## 🛠️ Commandes Utiles

### Récupérer les Informations

```powershell
# Informations de la Static Web App
az staticwebapp show --name iapostemanager-swa --resource-group iapostemanager-rg

# Deployment token
az staticwebapp secrets list --name iapostemanager-swa --resource-group iapostemanager-rg --query "properties.apiKey" -o tsv

# Liste des environnements
az staticwebapp environment list --name iapostemanager-swa --resource-group iapostemanager-rg
```

### Gestion des Domaines Personnalisés

```powershell
# Ajouter un domaine personnalisé
az staticwebapp hostname set --name iapostemanager-swa --resource-group iapostemanager-rg --hostname www.mondomaine.com

# Lister les domaines
az staticwebapp hostname list --name iapostemanager-swa --resource-group iapostemanager-rg
```

### Supprimer la Static Web App

```powershell
# ⚠️ Supprime toute la ressource
az staticwebapp delete --name iapostemanager-swa --resource-group iapostemanager-rg --yes
```

---

## 📦 Configuration Next.js pour Azure SWA

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Requis pour Azure SWA
  distDir: '.next',
  
  // Optimisations
  images: {
    unoptimized: true, // Azure SWA ne supporte pas l'optimisation d'images
  },
  
  // Webpack
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

module.exports = nextConfig;
```

---

## 🔄 Workflow Complet

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions]
    B --> C[Build Next.js]
    C --> D[Deploy to Azure SWA]
    D --> E[Production Live]
    
    F[Pull Request] --> G[Preview Environment]
    G --> H[Test Changes]
    H --> I[Merge PR]
    I --> J[Auto-deploy Production]
```

---

## ✅ Checklist de Vérification

### Avant le Premier Deploy

- [ ] Token Azure ajouté dans GitHub Secrets
- [ ] NEXTAUTH_SECRET configuré
- [ ] DATABASE_URL configuré
- [ ] Workflow file commité
- [ ] staticwebapp.config.json présent

### Après le Deploy

- [ ] URL de production accessible
- [ ] Pages Next.js chargent correctement
- [ ] API routes fonctionnent
- [ ] Authentication fonctionne
- [ ] Base de données accessible
- [ ] Logs sans erreurs

---

## 🎯 Prochaines Étapes

### 1. Configuration Production

- [ ] Configurer base de données PostgreSQL Azure
- [ ] Configurer variables d'environnement production
- [ ] Activer monitoring et alertes
- [ ] Configurer custom domain

### 2. Optimisations

- [ ] Activer CDN caching
- [ ] Configurer compression
- [ ] Optimiser bundle size
- [ ] Ajouter analytics

### 3. Sécurité

- [ ] Configurer WAF (Web Application Firewall)
- [ ] Activer SSL/TLS
- [ ] Configurer authentification avancée
- [ ] Audit de sécurité

---

## 📞 Support

### Documentation Azure

- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Deploy Next.js](https://docs.microsoft.com/azure/static-web-apps/deploy-nextjs)
- [Configuration](https://docs.microsoft.com/azure/static-web-apps/configuration)

### Troubleshooting

**Build échoue ?**
```bash
# Vérifier les logs GitHub Actions
gh run view --log

# Tester le build localement
npm run build
```

**Erreur de déploiement ?**
```bash
# Vérifier le token Azure
az staticwebapp secrets list --name iapostemanager-swa --resource-group iapostemanager-rg

# Re-créer le token si nécessaire
```

**Page 404 ?**
```bash
# Vérifier staticwebapp.config.json
# Vérifier les routes dans next.config.js
```

---

## 🎉 Résumé

✅ **Static Web App créée avec succès**  
✅ **Workflow GitHub Actions configuré**  
✅ **URL production disponible**  
⚠️ **À faire:** Ajouter AZURE_STATIC_WEB_APPS_API_TOKEN dans GitHub Secrets  

**URL de production:** https://agreeable-desert-0d1659d03.6.azurestaticapps.net

---

**Créé le:** 22 janvier 2026  
**Auteur:** GitHub Copilot  
**Version:** 1.0.0
