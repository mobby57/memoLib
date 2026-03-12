# 🚀 Guide de Déploiement - MemoLib

## 📋 Prérequis

- .NET 9.0 SDK
- Git
- Compte Gmail avec mot de passe d'application (optionnel)
- PostgreSQL (production) ou SQLite (développement)

---

## 🏠 Déploiement Local

### 1. Cloner le Projet
```bash
git clone https://github.com/VOTRE_USERNAME/MemoLib.git
cd MemoLib/MemoLib.Api
```

### 2. Restaurer et Configurer
```bash
# Restaurer packages
dotnet restore

# Créer la base de données
dotnet ef database update

# Configurer secrets (optionnel)
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe-app"
```

### 3. Lancer
```bash
dotnet run
```

**Accès:**
- API: http://localhost:5078
- Interface: http://localhost:5078/demo.html
- Formulaires: http://localhost:5078/intake-forms.html

---

## ☁️ Déploiement Azure

### 1. Créer les Ressources Azure
```bash
# Créer Resource Group
az group create --name memolib-rg --location westeurope

# Créer App Service Plan
az appservice plan create --name memolib-plan --resource-group memolib-rg --sku B1 --is-linux

# Créer Web App
az webapp create --name memolib-app --resource-group memolib-rg --plan memolib-plan --runtime "DOTNETCORE:9.0"

# Créer PostgreSQL
az postgres flexible-server create --name memolib-db --resource-group memolib-rg --admin-user memolib --admin-password "VotreMotDePasse123!" --sku-name Standard_B1ms
```

### 2. Configurer l'Application
```bash
# Connection string
az webapp config connection-string set --name memolib-app --resource-group memolib-rg --connection-string-type PostgreSQL --settings Default="Host=memolib-db.postgres.database.azure.com;Database=memolib;Username=memolib;Password=VotreMotDePasse123!"

# Variables d'environnement
az webapp config appsettings set --name memolib-app --resource-group memolib-rg --settings UsePostgreSQL=true JwtSettings__SecretKey="VotreCleSecrete32CaracteresMinimum"
```

### 3. Déployer
```bash
# Publier localement
dotnet publish -c Release -o ./publish

# Zipper
cd publish
zip -r ../app.zip .
cd ..

# Déployer sur Azure
az webapp deployment source config-zip --name memolib-app --resource-group memolib-rg --src app.zip
```

---

## 🐳 Déploiement Docker

### 1. Créer Dockerfile
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["MemoLib.Api.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MemoLib.Api.dll"]
```

### 2. Build et Run
```bash
# Build image
docker build -t memolib-api .

# Run container
docker run -d -p 5078:80 --name memolib memolib-api
```

### 3. Docker Compose (avec PostgreSQL)
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5078:80"
    environment:
      - UsePostgreSQL=true
      - ConnectionStrings__Default=Host=db;Database=memolib;Username=postgres;Password=postgres
    depends_on:
      - db
  
  db:
    image: postgres:16
    environment:
      - POSTGRES_DB=memolib
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

```bash
docker-compose up -d
```

---

## 🔧 Configuration par Environnement

### Development
```json
{
  "ConnectionStrings": {
    "Default": "Data Source=memolib-dev.db"
  },
  "UsePostgreSQL": false,
  "DisableHttpsRedirection": true
}
```

### Production
```json
{
  "ConnectionStrings": {
    "Default": "Host=prod-db;Database=memolib;Username=app;Password=***"
  },
  "UsePostgreSQL": true,
  "DisableHttpsRedirection": false
}
```

---

## 🔒 Sécurité Production

### Checklist
- [ ] HTTPS activé
- [ ] Secrets dans Azure Key Vault
- [ ] Rate limiting configuré
- [ ] CORS restreint aux domaines autorisés
- [ ] Logs activés (Serilog → Azure App Insights)
- [ ] Backup base de données automatique
- [ ] Monitoring actif

---

## 📊 Monitoring

### Azure Application Insights
```bash
# Ajouter instrumentation key
az webapp config appsettings set --name memolib-app --resource-group memolib-rg --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=..."
```

### Logs
```bash
# Voir logs en temps réel
az webapp log tail --name memolib-app --resource-group memolib-rg
```

---

## 🔄 Mise à Jour

### Via GitHub Actions (Automatique)
```bash
git push origin main  # Déploiement automatique
```

### Manuel
```bash
# Publier nouvelle version
dotnet publish -c Release -o ./publish

# Déployer
az webapp deployment source config-zip --name memolib-app --resource-group memolib-rg --src app.zip
```

---

## 🆘 Dépannage

### L'application ne démarre pas
```bash
# Vérifier logs
az webapp log tail --name memolib-app --resource-group memolib-rg

# Redémarrer
az webapp restart --name memolib-app --resource-group memolib-rg
```

### Erreur de connexion base de données
```bash
# Vérifier connection string
az webapp config connection-string list --name memolib-app --resource-group memolib-rg

# Tester connexion PostgreSQL
psql -h memolib-db.postgres.database.azure.com -U memolib -d memolib
```

---

## 💰 Coûts Estimés (Azure)

| Service | Plan | Coût/mois |
|---------|------|-----------|
| App Service | B1 Basic | ~13€ |
| PostgreSQL | B1ms | ~25€ |
| Storage | Standard | ~5€ |
| **Total** | | **~43€** |

---

## 📞 Support

Questions ? Consultez la documentation ou ouvrez une issue sur GitHub.
