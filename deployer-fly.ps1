# DEPLOIEMENT FLY.IO - MEMOLIB
Write-Host "DEPLOIEMENT FLY.IO - MEMOLIB" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host "Plateforme: Fly.io (3 apps GRATUITES)" -ForegroundColor Cyan

# 1. Vérifier Fly CLI
Write-Host "`nVerification Fly CLI..." -ForegroundColor Yellow
try {
    fly version | Out-Null
    Write-Host "OK Fly CLI installe" -ForegroundColor Green
} catch {
    Write-Host "Installation Fly CLI..." -ForegroundColor Yellow
    powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
    Write-Host "OK Fly CLI installe" -ForegroundColor Green
    Write-Host "IMPORTANT: Redemarrer le terminal puis relancer ce script" -ForegroundColor Red
    exit
}

# 2. Login Fly
Write-Host "`nConnexion Fly.io..." -ForegroundColor Yellow
fly auth login

# 3. Créer fly.toml
Write-Host "`nCreation fly.toml..." -ForegroundColor Yellow
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

Write-Host "OK fly.toml cree" -ForegroundColor Green

# 4. Vérifier Dockerfile
if (-not (Test-Path "Dockerfile")) {
    Write-Host "Creation Dockerfile..." -ForegroundColor Yellow
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

# 5. Créer .dockerignore
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

# 6. Lancer l'app
Write-Host "`nLancement application Fly.io..." -ForegroundColor Yellow
Write-Host "Cela peut prendre 2-3 minutes..." -ForegroundColor Gray

fly launch --no-deploy --name memolib-api --region cdg

# 7. Configurer secrets
Write-Host "`nConfiguration secrets..." -ForegroundColor Yellow
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
fly secrets set JwtSettings__SecretKey="$jwtSecret"

Write-Host "Configuration email Gmail (optionnel):" -ForegroundColor Yellow
$configEmail = Read-Host "Configurer email maintenant? (o/n)"
if ($configEmail -eq "o") {
    $email = Read-Host "Email Gmail"
    $password = Read-Host "Mot de passe application Gmail" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    fly secrets set EmailMonitor__Username="$email"
    fly secrets set EmailMonitor__Password="$passwordPlain"
    fly secrets set EmailMonitor__Enabled="true"
} else {
    fly secrets set EmailMonitor__Enabled="false"
}

# 8. Déployer
Write-Host "`nDeploiement en cours..." -ForegroundColor Yellow
fly deploy

# 9. Ouvrir l'app
Write-Host "`nOuverture de l'application..." -ForegroundColor Yellow
fly open

# 10. Afficher infos
Write-Host "`nDEPLOIEMENT TERMINE!" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "URL: https://memolib-api.fly.dev" -ForegroundColor Cyan
Write-Host "Demo: https://memolib-api.fly.dev/demo.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "COMMANDES UTILES:" -ForegroundColor Yellow
Write-Host "  fly status          - Voir statut" -ForegroundColor Gray
Write-Host "  fly logs            - Voir logs" -ForegroundColor Gray
Write-Host "  fly open            - Ouvrir app" -ForegroundColor Gray
Write-Host "  fly deploy          - Redeploy" -ForegroundColor Gray
Write-Host "  fly secrets list    - Voir secrets" -ForegroundColor Gray
Write-Host ""
Write-Host "COUT: 0 EUR (3 apps gratuites)" -ForegroundColor Green
Write-Host ""

# 11. Package Local
Write-Host "CREATION PACKAGE LOCAL:" -ForegroundColor Cyan
$createPackage = Read-Host "Creer package client local? (o/n)"
if ($createPackage -eq "o") {
    Write-Host "Publication..." -ForegroundColor White
    dotnet publish -c Release -o MemoLib-Package-Client/app
    
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
"@ | Out-File -FilePath MemoLib-Package-Client/install.ps1 -Encoding UTF8

    @"
Write-Host "Demarrage MemoLib..." -ForegroundColor Green
cd app
Start-Process "http://localhost:5078/demo.html"
dotnet MemoLib.Api.dll
"@ | Out-File -FilePath MemoLib-Package-Client/demarrer.ps1 -Encoding UTF8

    Compress-Archive -Path MemoLib-Package-Client\* -DestinationPath MemoLib-Client-v1.0.zip -Force
    Write-Host "OK Package cree: MemoLib-Client-v1.0.zip" -ForegroundColor Green
}

# 12. Résumé final
Write-Host "`nRESUME COMPLET:" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host "OK Fly.io deploye: https://memolib-api.fly.dev" -ForegroundColor Green
if (Test-Path "MemoLib-Client-v1.0.zip") {
    Write-Host "OK Package local: MemoLib-Client-v1.0.zip" -ForegroundColor Green
}
Write-Host ""
Write-Host "STRATEGIE COMMERCIALE:" -ForegroundColor Cyan
Write-Host "1. Demo en ligne: https://memolib-api.fly.dev/demo.html" -ForegroundColor White
Write-Host "2. Installation locale: MemoLib-Client-v1.0.zip (2,900 EUR)" -ForegroundColor White
Write-Host "3. Appeler prospects avec lien demo" -ForegroundColor White
Write-Host ""
Write-Host "COUT TOTAL: 0 EUR (GRATUIT)" -ForegroundColor Green
Write-Host ""
Write-Host "Script termine." -ForegroundColor Gray