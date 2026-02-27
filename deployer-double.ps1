# DEPLOIEMENT DOUBLE - FLY.IO + RENDER.COM
Write-Host "DEPLOIEMENT DOUBLE - MEMOLIB" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "Fly.io + Render.com (2 demos gratuites)" -ForegroundColor Cyan
Write-Host ""

function Confirm-Step {
    param([string]$message)
    $response = Read-Host "$message (o/n)"
    return $response.ToLower() -eq "o"
}

# ============================================
# 1. FLY.IO
# ============================================
Write-Host "1. DEPLOIEMENT FLY.IO" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow

if (Confirm-Step "Deployer sur Fly.io") {
    # Vérifier Fly CLI
    try {
        fly version | Out-Null
        Write-Host "OK Fly CLI installe" -ForegroundColor Green
    } catch {
        Write-Host "Installation Fly CLI..." -ForegroundColor Yellow
        powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
        Write-Host "OK Fly CLI installe - REDEMARRER LE TERMINAL" -ForegroundColor Red
        exit
    }
    
    # Login
    Write-Host "Connexion Fly.io..." -ForegroundColor White
    fly auth login
    
    # Créer fly.toml
    @"
app = "memolib-api"
primary_region = "cdg"

[build]
  dockerfile = "Dockerfile"

[env]
  ASPNETCORE_URLS = "http://+:8080"
  ASPNETCORE_ENVIRONMENT = "Production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
"@ | Out-File -FilePath fly.toml -Encoding UTF8
    
    # Lancer
    Write-Host "Lancement Fly.io..." -ForegroundColor White
    fly launch --no-deploy --name memolib-api --region cdg
    
    # Secrets
    Write-Host "Configuration secrets..." -ForegroundColor White
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
    fly secrets set JwtSettings__SecretKey="$jwtSecret"
    fly secrets set EmailMonitor__Enabled="false"
    
    # Déployer
    Write-Host "Deploiement..." -ForegroundColor White
    fly deploy
    
    Write-Host "OK Fly.io deploye: https://memolib-api.fly.dev" -ForegroundColor Green
} else {
    Write-Host "Fly.io ignore" -ForegroundColor Yellow
}

# ============================================
# 2. RENDER.COM
# ============================================
Write-Host "`n2. DEPLOIEMENT RENDER.COM" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow

if (Confirm-Step "Deployer sur Render.com") {
    # Créer render.yaml
    @"
services:
  - type: web
    name: memolib-api
    env: docker
    plan: free
    dockerfilePath: ./Dockerfile
    envVars:
      - key: ASPNETCORE_URLS
        value: http://+:8080
      - key: JwtSettings__SecretKey
        generateValue: true
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: EmailMonitor__Enabled
        value: false
"@ | Out-File -FilePath render.yaml -Encoding UTF8
    
    Write-Host "OK render.yaml cree" -ForegroundColor Green
    Write-Host ""
    Write-Host "ETAPES MANUELLES RENDER.COM:" -ForegroundColor Cyan
    Write-Host "1. Aller sur render.com" -ForegroundColor White
    Write-Host "2. New > Web Service" -ForegroundColor White
    Write-Host "3. Connecter GitHub repo" -ForegroundColor White
    Write-Host "4. Render detecte render.yaml automatiquement" -ForegroundColor White
    Write-Host "5. Deploy!" -ForegroundColor White
    Write-Host ""
    Write-Host "URL finale: https://memolib-api.onrender.com" -ForegroundColor Cyan
    
    $openRender = Read-Host "Ouvrir render.com maintenant? (o/n)"
    if ($openRender -eq "o") {
        Start-Process "https://render.com"
    }
} else {
    Write-Host "Render.com ignore" -ForegroundColor Yellow
}

# ============================================
# 3. DOCKERFILE (si manquant)
# ============================================
if (-not (Test-Path "Dockerfile")) {
    Write-Host "`nCreation Dockerfile..." -ForegroundColor Yellow
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
    Write-Host "OK Dockerfile cree" -ForegroundColor Green
}

# ============================================
# 4. .dockerignore (si manquant)
# ============================================
if (-not (Test-Path ".dockerignore")) {
    @"
bin/
obj/
*.db
*.db-shm
*.db-wal
uploads/
node_modules/
.git/
.vs/
*.user
"@ | Out-File -FilePath .dockerignore -Encoding UTF8
    Write-Host "OK .dockerignore cree" -ForegroundColor Green
}

# ============================================
# 5. PACKAGE LOCAL
# ============================================
Write-Host "`n3. PACKAGE LOCAL CLIENT" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

if (Confirm-Step "Creer package client local") {
    Write-Host "Publication Release..." -ForegroundColor White
    dotnet publish -c Release -o MemoLib-Package-Client/app
    
    # Script installation
    @"
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
`$email = Read-Host "Email Gmail"
`$password = Read-Host "Mot de passe application" -AsSecureString
`$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR(`$password))
dotnet user-secrets set "EmailMonitor:Username" "`$email"
dotnet user-secrets set "EmailMonitor:Password" "`$passwordPlain"
Write-Host "Installation terminee!" -ForegroundColor Green
Write-Host "Lancer: ..\demarrer.ps1" -ForegroundColor Cyan
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
Tel: 03 87 XX XX XX
"@ | Out-File -FilePath MemoLib-Package-Client/README.txt -Encoding UTF8

    # Compression
    Compress-Archive -Path MemoLib-Package-Client\* -DestinationPath MemoLib-Client-v1.0.zip -Force
    Write-Host "OK Package cree: MemoLib-Client-v1.0.zip" -ForegroundColor Green
    Write-Host "Taille: $([math]::Round((Get-Item MemoLib-Client-v1.0.zip).Length / 1MB, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "Package local ignore" -ForegroundColor Yellow
}

# ============================================
# 6. RESUME FINAL
# ============================================
Write-Host "`nRESUME DEPLOIEMENT" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""

if (Test-Path "fly.toml") {
    Write-Host "OK Fly.io: https://memolib-api.fly.dev" -ForegroundColor Green
    Write-Host "   Demo: https://memolib-api.fly.dev/demo.html" -ForegroundColor Cyan
}

if (Test-Path "render.yaml") {
    Write-Host "OK Render: https://memolib-api.onrender.com" -ForegroundColor Green
    Write-Host "   Demo: https://memolib-api.onrender.com/demo.html" -ForegroundColor Cyan
}

if (Test-Path "MemoLib-Client-v1.0.zip") {
    Write-Host "OK Package: MemoLib-Client-v1.0.zip" -ForegroundColor Green
}

Write-Host ""
Write-Host "STRATEGIE COMMERCIALE:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "1. Demo Fly.io (rapide, pas de sleep)" -ForegroundColor White
Write-Host "2. Demo Render (backup, 750h/mois)" -ForegroundColor White
Write-Host "3. Installation locale (2,900 EUR HT)" -ForegroundColor White
Write-Host ""
Write-Host "PROCHAINES ACTIONS:" -ForegroundColor Yellow
Write-Host "1. Tester les 2 demos en ligne" -ForegroundColor White
Write-Host "2. Envoyer liens aux prospects" -ForegroundColor White
Write-Host "3. Proposer installation locale" -ForegroundColor White
Write-Host "4. Signer premiers contrats" -ForegroundColor White
Write-Host ""
Write-Host "COUT TOTAL: 0 EUR (100% GRATUIT)" -ForegroundColor Green
Write-Host ""
Write-Host "Script termine." -ForegroundColor Gray