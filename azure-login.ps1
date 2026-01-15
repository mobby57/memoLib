# Script de connexion Azure avec PATH recharge
# IA Poste Manager - Azure Deployment Helper

Write-Host "[Azure Login] Rechargement du PATH systeme..." -ForegroundColor Cyan

# Recharger le PATH depuis les variables d'environnement systeme
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "[OK] PATH recharge" -ForegroundColor Green

# Verifier Azure CLI
Write-Host "`n[Check] Verification d'Azure CLI..." -ForegroundColor Cyan
try {
    $azVersion = az --version 2>$null | Select-Object -First 1
    Write-Host "[OK] Azure CLI detecte: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Azure CLI introuvable dans le PATH" -ForegroundColor Red
    Write-Host "[TIP] Installer avec: winget install -e --id Microsoft.AzureCLI" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[Login] Connexion a Azure..." -ForegroundColor Cyan
Write-Host "Une fenetre de navigateur va s'ouvrir pour l'authentification.`n" -ForegroundColor Yellow

# Tenter la connexion
az login

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Connexion Azure reussie!" -ForegroundColor Green
    Write-Host "`n[List] Subscriptions disponibles:" -ForegroundColor Cyan
    az account list --output table
    
    Write-Host "`n[Next Steps] Prochaines etapes:" -ForegroundColor Cyan
    Write-Host "1. Verifiez votre subscription active" -ForegroundColor White
    Write-Host "2. Creez le Resource Group: az group create --name rg-iapostemanager --location francecentral" -ForegroundColor White
    Write-Host "3. Suivez le guide dans docs\AZURE_DEPLOYMENT.md" -ForegroundColor White
} else {
    Write-Host "`n[ERROR] Echec de la connexion" -ForegroundColor Red
    Write-Host "[TIP] Essayez avec le code appareil: az login --use-device-code" -ForegroundColor Yellow
}
