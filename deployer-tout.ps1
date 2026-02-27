# DEPLOIEMENT AUTOMATIQUE MEMOLIB - 3 OPTIONS
Write-Host "DEPLOIEMENT AUTOMATIQUE MEMOLIB" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

function Confirm-Step {
    param([string]$message)
    $response = Read-Host "$message (o/n)"
    return $response.ToLower() -eq "o"
}

# 1. RAILWAY
Write-Host "`n1. RAILWAY.APP - DEMO EN LIGNE" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Cout: 5 USD/mois (compte gratuit epuise)" -ForegroundColor Yellow
Write-Host "URL finale: https://memolib-production.up.railway.app" -ForegroundColor White

if (Confirm-Step "Deployer sur Railway") {
    Write-Host "Verification Railway CLI..." -ForegroundColor White
    
    try {
        railway --version | Out-Null
        Write-Host "OK Railway CLI installe" -ForegroundColor Green
    } catch {
        Write-Host "Installation Railway CLI..." -ForegroundColor Yellow
        npm install -g @railway/cli
    }
    
    Write-Host "Connexion Railway..." -ForegroundColor White
    railway login
    
    Write-Host "Initialisation projet..." -ForegroundColor White
    railway init
    
    Write-Host "Deploiement en cours..." -ForegroundColor White
    railway up
    
    Write-Host "`nOK Railway deploye!" -ForegroundColor Green
    Write-Host "Configurer les variables dans Railway Dashboard:" -ForegroundColor Yellow
    Write-Host "  JwtSettings__SecretKey = [32+ caracteres]" -ForegroundColor Gray
    Write-Host "  EmailMonitor__Password = [mot-de-passe-gmail]" -ForegroundColor Gray
    Write-Host "  EmailMonitor__Username = [votre-email@gmail.com]" -ForegroundColor Gray
} else {
    Write-Host "Railway ignore" -ForegroundColor Yellow
}

# 2. PACKAGE LOCAL
Write-Host "`n2. PACKAGE LOCAL - CLIENTS" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "Cout: 0 EUR (gratuit)" -ForegroundColor Green
Write-Host "Installation: Chez chaque client" -ForegroundColor White

if (Confirm-Step "Creer package client") {
    Write-Host "Publication Release..." -ForegroundColor White
    dotnet publish -c Release -o MemoLib-Package-Client/app
    
    Write-Host "Creation scripts installation..." -ForegroundColor White
    
    # Script installation
    @"
# INSTALLATION MEMOLIB CLIENT
Write-Host "Installation MemoLib..." -ForegroundColor Green

try {
    dotnet --version | Out-Null
    Write-Host "OK .NET installe" -ForegroundColor Green
} catch {
    Write-Host "ERREUR .NET 9.0 requis" -ForegroundColor Red
    Write-Host "Telecharger: https://dotnet.microsoft.com/download/dotnet/9.0"
    exit 1
}

cd app
Write-Host "Configuration email Gmail:" -ForegroundColor Yellow
`$email = Read-Host "Email Gmail"
`$password = Read-Host "Mot de passe application" -AsSecureString
`$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR(`$password))

dotnet user-secrets set "EmailMonitor:Username" "`$email"
dotnet user-secrets set "EmailMonitor:Password" "`$passwordPlain"

Write-Host "Installation terminee!" -ForegroundColor Green
Write-Host "Lancer: .\demarrer.ps1" -ForegroundColor Cyan
"@ | Out-File -FilePath MemoLib-Package-Client/install.ps1 -Encoding UTF8

    # Script démarrage
    @"
Write-Host "Demarrage MemoLib..." -ForegroundColor Green
cd app
Start-Process "http://localhost:5078/demo.html"
dotnet MemoLib.Api.dll
"@ | Out-File -FilePath MemoLib-Package-Client/demarrer.ps1 -Encoding UTF8

    # README
    @"
MEMOLIB - INSTALLATION CLIENT

Prerequis:
- Windows 10/11
- .NET 9.0 SDK

Installation:
1. Executer: install.ps1
2. Suivre les instructions
3. Lancer: demarrer.ps1

Acces:
http://localhost:5078/demo.html

Support:
Email: support@ms-conseils.fr
"@ | Out-File -FilePath MemoLib-Package-Client/README.txt -Encoding UTF8

    Write-Host "Compression package..." -ForegroundColor White
    Compress-Archive -Path MemoLib-Package-Client\* -DestinationPath MemoLib-Client-v1.0.zip -Force
    
    Write-Host "`nOK Package cree: MemoLib-Client-v1.0.zip" -ForegroundColor Green
    Write-Host "Taille: $((Get-Item MemoLib-Client-v1.0.zip).Length / 1MB) MB" -ForegroundColor Gray
} else {
    Write-Host "Package local ignore" -ForegroundColor Yellow
}

# 3. AZURE
Write-Host "`n3. AZURE APP SERVICE - ENTREPRISE" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Cout: 28 EUR/mois (App Service + SQL)" -ForegroundColor Yellow
Write-Host "URL finale: https://memolib-api.azurewebsites.net" -ForegroundColor White

if (Confirm-Step "Deployer sur Azure") {
    Write-Host "Verification Azure CLI..." -ForegroundColor White
    
    try {
        az --version | Out-Null
        Write-Host "OK Azure CLI installe" -ForegroundColor Green
    } catch {
        Write-Host "ERREUR Azure CLI requis" -ForegroundColor Red
        Write-Host "Installer: winget install Microsoft.AzureCLI" -ForegroundColor Yellow
        Write-Host "Puis relancer ce script" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Connexion Azure..." -ForegroundColor White
    az login
    
    $appName = Read-Host "Nom de l'application (ex: memolib-api)"
    $resourceGroup = "$appName-rg"
    
    Write-Host "Creation groupe de ressources..." -ForegroundColor White
    az group create --name $resourceGroup --location westeurope
    
    Write-Host "Creation App Service..." -ForegroundColor White
    az webapp up --name $appName --runtime "DOTNETCORE:9.0" --sku B1 --resource-group $resourceGroup
    
    Write-Host "`nOK Azure deploye!" -ForegroundColor Green
    Write-Host "URL: https://$appName.azurewebsites.net" -ForegroundColor Cyan
    Write-Host "`nConfigurer les variables dans Azure Portal:" -ForegroundColor Yellow
    Write-Host "  JwtSettings__SecretKey" -ForegroundColor Gray
    Write-Host "  EmailMonitor__Password" -ForegroundColor Gray
    Write-Host "  EmailMonitor__Username" -ForegroundColor Gray
} else {
    Write-Host "Azure ignore" -ForegroundColor Yellow
}

# RESUME
Write-Host "`nRESUME DEPLOIEMENT" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

if (Test-Path "MemoLib-Client-v1.0.zip") {
    Write-Host "OK Package local: MemoLib-Client-v1.0.zip" -ForegroundColor Green
}

Write-Host "`nPROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host "1. Tester Railway demo en ligne" -ForegroundColor White
Write-Host "2. Envoyer package local aux clients" -ForegroundColor White
Write-Host "3. Configurer variables environnement" -ForegroundColor White
Write-Host "4. Commencer prospection commerciale" -ForegroundColor White

Write-Host "`nScript termine." -ForegroundColor Gray