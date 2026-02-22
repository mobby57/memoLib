#!/bin/bash

# MemoLib Production Deployment Script

set -e

echo "🚀 Déploiement MemoLib en production"

# Variables
APP_NAME="memolib-api"
RESOURCE_GROUP="memolib-rg"
LOCATION="francecentral"

# 1. Build et test local
echo "📦 Build et tests..."
dotnet build --configuration Release
dotnet test --no-build

# 2. Création des ressources Azure
echo "☁️ Création des ressources Azure..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 3. App Service
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --runtime "DOTNETCORE:9.0"

# 4. Configuration sécurisée
echo "🔐 Configuration de la sécurité..."
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "ASPNETCORE_ENVIRONMENT=Production" \
    "AllowedHosts=*.azurewebsites.net" \
    "ConnectionStrings__DefaultConnection=@Microsoft.KeyVault(SecretUri=https://memolib-kv.vault.azure.net/secrets/db-connection/)" \
    "JwtSettings__SecretKey=@Microsoft.KeyVault(SecretUri=https://memolib-kv.vault.azure.net/secrets/jwt-secret/)"

# 5. HTTPS forcé
az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true

# 6. Déploiement
echo "🚀 Déploiement de l'application..."
dotnet publish --configuration Release --output ./publish
az webapp deployment source config-zip \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --src ./publish.zip

echo "✅ Déploiement terminé: https://${APP_NAME}.azurewebsites.net"