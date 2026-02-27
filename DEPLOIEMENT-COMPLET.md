# 🚀 DÉPLOIEMENT COMPLET MEMOLIB - 3 OPTIONS

## 📋 PLAN D'ACTION

1. ✅ **Railway.app** (Démo en ligne - 5$/mois)
2. ✅ **Installation Locale** (Clients - Gratuit)
3. ✅ **Azure App Service** (Entreprise - 13€/mois)

---

## 1️⃣ RAILWAY.APP - DÉMO EN LIGNE

### Préparation (5 minutes)

```powershell
cd c:\Users\moros\Desktop\memolib\MemoLib.Api

# Créer Dockerfile
@"
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MemoLib.Api.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MemoLib.Api.dll"]
"@ | Out-File -FilePath Dockerfile -Encoding UTF8

# Créer .dockerignore
@"
bin/
obj/
*.db
*.db-shm
*.db-wal
uploads/
node_modules/
.git/
"@ | Out-File -FilePath .dockerignore -Encoding UTF8
```

### Déploiement Railway

**Option A: Via GitHub (Recommandé)**
```bash
# 1. Créer repo GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE_USERNAME/memolib.git
git push -u origin main

# 2. Sur railway.app:
# - New Project
# - Deploy from GitHub repo
# - Sélectionner memolib
# - Railway détecte Dockerfile automatiquement
```

**Option B: Via CLI**
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Créer projet
railway init

# Déployer
railway up
```

### Configuration Variables Railway

```
Dans Railway Dashboard > Variables:

JwtSettings__SecretKey = VotreClé32CaractèresMinimum123456
EmailMonitor__Password = votre-mot-de-passe-gmail-app
EmailMonitor__Username = votre-email@gmail.com
ConnectionStrings__Default = Data Source=/app/data/memolib.db
ASPNETCORE_ENVIRONMENT = Production
```

### URL Finale
```
https://memolib-production.up.railway.app
```

**Coût:** 5$/mois (~4.50€/mois)

---

## 2️⃣ INSTALLATION LOCALE - CLIENTS

### Package Client Complet

```powershell
# Créer dossier package
New-Item -ItemType Directory -Path "MemoLib-Package-Client" -Force
cd MemoLib-Package-Client

# Publier application
cd ..\MemoLib.Api
dotnet publish -c Release -o ..\MemoLib-Package-Client\app

# Créer script installation
cd ..\MemoLib-Package-Client
@"
# INSTALLATION MEMOLIB - CLIENT
Write-Host "Installation MemoLib..." -ForegroundColor Green

# Vérifier .NET 9.0
try {
    dotnet --version | Out-Null
    Write-Host "OK .NET installe" -ForegroundColor Green
} catch {
    Write-Host "ERREUR .NET 9.0 requis" -ForegroundColor Red
    Write-Host "Telecharger: https://dotnet.microsoft.com/download/dotnet/9.0"
    exit 1
}

# Créer base de données
cd app
dotnet MemoLib.Api.dll --migrate

# Configurer secrets
Write-Host "`nConfiguration email Gmail:" -ForegroundColor Yellow
`$email = Read-Host "Email Gmail"
`$password = Read-Host "Mot de passe application Gmail" -AsSecureString
`$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR(`$password))

dotnet user-secrets set "EmailMonitor:Username" "`$email"
dotnet user-secrets set "EmailMonitor:Password" "`$passwordPlain"

Write-Host "`nInstallation terminee!" -ForegroundColor Green
Write-Host "Lancer: .\demarrer.ps1" -ForegroundColor Cyan
"@ | Out-File -FilePath install.ps1 -Encoding UTF8

# Créer script démarrage
@"
# DEMARRAGE MEMOLIB
Write-Host "Demarrage MemoLib..." -ForegroundColor Green
cd app
Start-Process "http://localhost:5078/demo.html"
dotnet MemoLib.Api.dll
"@ | Out-File -FilePath demarrer.ps1 -Encoding UTF8

# Créer README
@"
# MEMOLIB - INSTALLATION CLIENT

## Prérequis
- Windows 10/11
- .NET 9.0 SDK

## Installation
1. Exécuter: install.ps1
2. Suivre les instructions
3. Lancer: demarrer.ps1

## Accès
http://localhost:5078/demo.html

## Support
Email: support@ms-conseils.fr
Tél: 03 87 XX XX XX
"@ | Out-File -FilePath README.txt -Encoding UTF8
```

### Créer Archive Client

```powershell
# Compresser
Compress-Archive -Path MemoLib-Package-Client\* -DestinationPath MemoLib-Client-v1.0.zip

Write-Host "Package client cree: MemoLib-Client-v1.0.zip" -ForegroundColor Green
```

**Livraison:** Envoyer MemoLib-Client-v1.0.zip au client

---

## 3️⃣ AZURE APP SERVICE - ENTREPRISE

### Prérequis

```powershell
# Installer Azure CLI
winget install Microsoft.AzureCLI

# Redémarrer terminal puis:
az --version
```

### Déploiement Azure

```powershell
# 1. Connexion
az login

# 2. Créer groupe de ressources
az group create --name memolib-rg --location westeurope

# 3. Créer App Service Plan
az appservice plan create `
  --name memolib-plan `
  --resource-group memolib-rg `
  --sku B1 `
  --is-linux

# 4. Créer Web App
az webapp create `
  --name memolib-api `
  --resource-group memolib-rg `
  --plan memolib-plan `
  --runtime "DOTNETCORE:9.0"

# 5. Configurer variables
az webapp config appsettings set `
  --name memolib-api `
  --resource-group memolib-rg `
  --settings `
    JwtSettings__SecretKey="VotreClé32Caractères" `
    EmailMonitor__Password="votre-password" `
    ASPNETCORE_ENVIRONMENT="Production"

# 6. Publier
dotnet publish -c Release
cd bin/Release/net9.0/publish
Compress-Archive -Path * -DestinationPath ../deploy.zip

# 7. Déployer
az webapp deployment source config-zip `
  --name memolib-api `
  --resource-group memolib-rg `
  --src ../deploy.zip
```

### URL Finale
```
https://memolib-api.azurewebsites.net
```

### Configuration Base de Données Azure

```powershell
# Option 1: Azure SQL Database (recommandé production)
az sql server create `
  --name memolib-sql `
  --resource-group memolib-rg `
  --location westeurope `
  --admin-user memolib `
  --admin-password "VotreMotDePasse123!"

az sql db create `
  --name memolib-db `
  --server memolib-sql `
  --resource-group memolib-rg `
  --service-objective S0

# Mettre à jour connection string
az webapp config connection-string set `
  --name memolib-api `
  --resource-group memolib-rg `
  --connection-string-type SQLAzure `
  --settings Default="Server=tcp:memolib-sql.database.windows.net,1433;Database=memolib-db;User ID=memolib;Password=VotreMotDePasse123!;Encrypt=True;"
```

**Coût Azure:**
- App Service B1: ~13€/mois
- SQL Database S0: ~15€/mois
- **Total: ~28€/mois**

---

## 📊 COMPARAISON FINALE

| Solution | Coût/mois | Complexité | Usage |
|----------|-----------|------------|-------|
| **Railway** | 5€ | ⭐ Facile | Démo prospects |
| **Local** | 0€ | ⭐⭐ Moyen | Clients finaux |
| **Azure** | 28€ | ⭐⭐⭐⭐ Complexe | Multi-clients cloud |

---

## 🎯 STRATÉGIE RECOMMANDÉE

### Maintenant (Semaine 1)
```
1. ✅ Déployer Railway (démo en ligne)
2. ✅ Créer package local (clients)
3. ⏳ Préparer Azure (future)
```

### Utilisation
```
Railway → Démos prospects (URL publique)
Local → Installations clients (sécurisé)
Azure → Future expansion multi-clients
```

### URLs Finales
```
Démo: https://memolib-demo.railway.app
Docs: https://github.com/VOTRE_USERNAME/memolib
Support: support@ms-conseils.fr
```

---

## 🚀 SCRIPT DÉPLOIEMENT COMPLET

```powershell
# DEPLOIEMENT COMPLET MEMOLIB
Write-Host "DEPLOIEMENT COMPLET MEMOLIB" -ForegroundColor Green

# 1. Railway
Write-Host "`n1. RAILWAY DEMO" -ForegroundColor Yellow
if (Confirm-Step "Deployer sur Railway") {
    railway login
    railway init
    railway up
    Write-Host "OK Railway deploye" -ForegroundColor Green
}

# 2. Package Local
Write-Host "`n2. PACKAGE LOCAL" -ForegroundColor Yellow
if (Confirm-Step "Creer package client") {
    dotnet publish -c Release -o MemoLib-Package/app
    Compress-Archive -Path MemoLib-Package\* -DestinationPath MemoLib-Client.zip -Force
    Write-Host "OK Package cree: MemoLib-Client.zip" -ForegroundColor Green
}

# 3. Azure
Write-Host "`n3. AZURE APP SERVICE" -ForegroundColor Yellow
if (Confirm-Step "Deployer sur Azure") {
    az login
    az webapp up --name memolib-api --runtime "DOTNETCORE:9.0" --sku B1
    Write-Host "OK Azure deploye" -ForegroundColor Green
}

Write-Host "`nDeploiement termine!" -ForegroundColor Green
```

**Prêt à déployer sur les 3 plateformes ?**
