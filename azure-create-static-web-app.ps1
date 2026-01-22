param(
    [string]$ResourceGroup = "iapostemanager-rg",
    [string]$AppName = "iapostemanager-app",
    [string]$Location = "westeurope",
    [string]$Sku = "Free",
    [string]$Branch = "main"
)

Write-Host "`nAZURE STATIC WEB APPS - CREATION AUTOMATIQUE`n" -ForegroundColor Cyan

Write-Host "1. Verification Azure CLI..." -ForegroundColor Yellow
try {
    $null = az version --output json 2>&1
    Write-Host "   OK Azure CLI installe`n" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR: Azure CLI non installe" -ForegroundColor Red
    Write-Host "   Installer: winget install Microsoft.AzureCLI" -ForegroundColor White
    exit 1
}

Write-Host "2. Connexion Azure..." -ForegroundColor Yellow
$account = az account show 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue
if (-not $account) {
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "   OK Connecte: $($account.user.name)`n" -ForegroundColor Green

Write-Host "3. Installation extension staticwebapp..." -ForegroundColor Yellow
az extension add --name staticwebapp --yes --only-show-errors 2>&1 | Out-Null
Write-Host "   OK Extension installee`n" -ForegroundColor Green

Write-Host "4. Creation Resource Group..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none 2>&1 | Out-Null
Write-Host "   OK Resource Group cree`n" -ForegroundColor Green

Write-Host "5. Creation Static Web App (1-2 min)..." -ForegroundColor Yellow
az staticwebapp create --name $AppName --resource-group $ResourceGroup --source "https://github.com/mobby57/iapostemanager" --location $Location --branch $Branch --app-location "/" --output-location ".next" --sku $Sku --login-with-github --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK Static Web App creee`n" -ForegroundColor Green
    
    Write-Host "6. Recuperation des informations..." -ForegroundColor Yellow
    $app = az staticwebapp show --name $AppName --resource-group $ResourceGroup --output json | ConvertFrom-Json
    $secrets = az staticwebapp secrets list --name $AppName --resource-group $ResourceGroup --output json | ConvertFrom-Json
    $token = $secrets.properties.apiKey
    
    Write-Host "`n====== SUCCES ======`n" -ForegroundColor Green
    Write-Host "URL: https://$($app.defaultHostname)" -ForegroundColor Yellow
    Write-Host "`nDEPLOYMENT TOKEN:" -ForegroundColor Red
    Write-Host $token -ForegroundColor Yellow
    
    Set-Clipboard -Value $token
    Write-Host "`nToken copie dans le presse-papiers !`n" -ForegroundColor Green
    
    Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
    Write-Host "1. Aller sur: https://github.com/mobby57/iapostemanager/settings/secrets/actions" -ForegroundColor White
    Write-Host "2. New repository secret" -ForegroundColor White
    Write-Host "3. Name: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
    Write-Host "4. Value: Ctrl+V (token copie)" -ForegroundColor White
    Write-Host "5. Add secret`n" -ForegroundColor White
    
    Start-Process "https://github.com/mobby57/iapostemanager/settings/secrets/actions"
    
    $info = "URL: https://$($app.defaultHostname)`nTOKEN: $token"
    $info | Out-File "azure-deployment-info.txt" -Encoding utf8
    Write-Host "Info sauvegardee dans: azure-deployment-info.txt`n" -ForegroundColor Gray
} else {
    Write-Host "   ERREUR: Echec creation" -ForegroundColor Red
    exit 1
}
