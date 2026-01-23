# ============================================
# Setup Azure Services for IA Poste Manager
# ============================================
# Ce script cree les ressources Azure necessaires :
# - Azure Database for PostgreSQL Flexible Server
# - Azure Key Vault (pour les secrets)
# - Azure Blob Storage (pour les fichiers)
# ============================================

param(
    [string]$ResourceGroup = "rg-iapostemanager",
    [string]$Location = "francecentral",
    [string]$PostgresServerName = "psql-iapostemanager",
    [string]$KeyVaultName = "kv-iapostemanager",
    [string]$StorageAccountName = "stiapostemanager",
    [string]$PostgresAdmin = "psqladmin",
    [securestring]$PostgresPassword
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Azure Services Setup - IA Poste Manager" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Verification connexion Azure CLI
Write-Host "`n[1/8] Verification connexion Azure CLI..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Non connecte a Azure. Connexion en cours..." -ForegroundColor Red
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "Connecte: $($account.user.name)" -ForegroundColor Green
Write-Host "Subscription: $($account.name) ($($account.id))" -ForegroundColor Green

# Demander mot de passe PostgreSQL si non fourni
if (-not $PostgresPassword) {
    $PostgresPassword = Read-Host "Entrez le mot de passe PostgreSQL (min 8 chars, avec chiffres et majuscules)" -AsSecureString
}
$PostgresPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($PostgresPassword))

# Creer le Resource Group
Write-Host "`n[2/8] Creation Resource Group: $ResourceGroup..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
Write-Host "Resource Group cree" -ForegroundColor Green

# Creer Azure Database for PostgreSQL Flexible Server
Write-Host "`n[3/8] Creation Azure PostgreSQL Flexible Server: $PostgresServerName..." -ForegroundColor Yellow
Write-Host "Cela peut prendre 5-10 minutes..." -ForegroundColor Gray

az postgres flexible-server create `
    --name $PostgresServerName `
    --resource-group $ResourceGroup `
    --location $Location `
    --admin-user $PostgresAdmin `
    --admin-password $PostgresPasswordPlain `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 32 `
    --version 16 `
    --public-access 0.0.0.0-255.255.255.255 `
    --yes `
    --output none

Write-Host "PostgreSQL Server cree" -ForegroundColor Green

# Creer la base de donnees
Write-Host "`n[4/8] Creation base de donnees: iapostemanager..." -ForegroundColor Yellow
az postgres flexible-server db create `
    --resource-group $ResourceGroup `
    --server-name $PostgresServerName `
    --database-name iapostemanager `
    --output none

Write-Host "Base de donnees creee" -ForegroundColor Green

# Creer Azure Key Vault
Write-Host "`n[5/8] Creation Azure Key Vault: $KeyVaultName..." -ForegroundColor Yellow
az keyvault create `
    --name $KeyVaultName `
    --resource-group $ResourceGroup `
    --location $Location `
    --enable-rbac-authorization false `
    --output none

Write-Host "Key Vault cree" -ForegroundColor Green

# Creer Azure Storage Account
Write-Host "`n[6/8] Creation Azure Storage Account: $StorageAccountName..." -ForegroundColor Yellow
az storage account create `
    --name $StorageAccountName `
    --resource-group $ResourceGroup `
    --location $Location `
    --sku Standard_LRS `
    --kind StorageV2 `
    --output none

Write-Host "Storage Account cree" -ForegroundColor Green

# Creer un container blob pour les fichiers
Write-Host "`n[7/8] Creation Blob Container: documents..." -ForegroundColor Yellow
$storageKey = az storage account keys list --resource-group $ResourceGroup --account-name $StorageAccountName --query "[0].value" -o tsv
az storage container create `
    --name documents `
    --account-name $StorageAccountName `
    --account-key $storageKey `
    --output none

Write-Host "Blob Container cree" -ForegroundColor Green

# Recuperer les informations de connexion
Write-Host "`n[8/8] Recuperation des informations de connexion..." -ForegroundColor Yellow

$postgresHost = "$PostgresServerName.postgres.database.azure.com"
$databaseUrl = "postgresql://${PostgresAdmin}:${PostgresPasswordPlain}@${postgresHost}:5432/iapostemanager?sslmode=require"
$storageConnectionString = az storage account show-connection-string --resource-group $ResourceGroup --name $StorageAccountName --query connectionString -o tsv
$keyVaultUri = "https://${KeyVaultName}.vault.azure.net/"

# Stocker les secrets dans Key Vault
Write-Host "`nStockage des secrets dans Key Vault..." -ForegroundColor Yellow
az keyvault secret set --vault-name $KeyVaultName --name "DATABASE-URL" --value $databaseUrl --output none
az keyvault secret set --vault-name $KeyVaultName --name "STORAGE-CONNECTION-STRING" --value $storageConnectionString --output none
Write-Host "Secrets stockes dans Key Vault" -ForegroundColor Green

# Creer fichier .env.azure
Write-Host "`nCreation fichier .env.azure..." -ForegroundColor Yellow
@"
# ============================================
# Azure Services Configuration
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================

# Azure Database for PostgreSQL
DATABASE_URL="$databaseUrl"
POSTGRES_HOST=$postgresHost
POSTGRES_USER=$PostgresAdmin
POSTGRES_DB=iapostemanager

# Azure Key Vault
AZURE_KEY_VAULT_URI=$keyVaultUri

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="$storageConnectionString"
AZURE_STORAGE_CONTAINER=documents

# Azure AD (deja configure)
AZURE_AD_CLIENT_ID=db09cb06-7111-4981-9bd4-cbaf914ad908
AZURE_AD_TENANT_ID=e918e8cf-5b1e-4faa-a9ee-32c3a542a18d
AZURE_AD_CLIENT_SECRET=797810c1-98af-4248-b432-5c033e178c0f

# Resource Info
AZURE_RESOURCE_GROUP=$ResourceGroup
AZURE_LOCATION=$Location
"@ | Out-File -FilePath ".env.azure" -Encoding utf8

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " CONFIGURATION TERMINEE !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`nRessources creees:" -ForegroundColor Cyan
Write-Host "  - PostgreSQL: $postgresHost" -ForegroundColor White
Write-Host "  - Database: iapostemanager" -ForegroundColor White
Write-Host "  - Key Vault: $keyVaultUri" -ForegroundColor White
Write-Host "  - Storage: $StorageAccountName" -ForegroundColor White

Write-Host "`nProchaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Copiez DATABASE_URL de .env.azure vers .env.local" -ForegroundColor White
Write-Host "  2. Executez: npx prisma db push" -ForegroundColor White
Write-Host "  3. Executez: npx prisma db seed" -ForegroundColor White
Write-Host "  4. Ajoutez les variables dans Vercel" -ForegroundColor White

Write-Host "`nCommande Vercel:" -ForegroundColor Yellow
Write-Host "  vercel env add DATABASE_URL" -ForegroundColor Gray
Write-Host "  vercel env add AZURE_STORAGE_CONNECTION_STRING" -ForegroundColor Gray

Write-Host "`n"
