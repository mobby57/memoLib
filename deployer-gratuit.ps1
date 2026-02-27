# DEPLOIEMENT GRATUIT MEMOLIB - RENDER.COM
Write-Host "DEPLOIEMENT GRATUIT MEMOLIB" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green
Write-Host "Plateforme: Render.com (100% GRATUIT)" -ForegroundColor Cyan

# 1. Créer render.yaml
Write-Host "`nCreation render.yaml..." -ForegroundColor Yellow
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
        value: VotreCle32CaracteresMinimumSecure123
      - key: ASPNETCORE_ENVIRONMENT
        value: Production
      - key: EmailMonitor__Enabled
        value: false
"@ | Out-File -FilePath render.yaml -Encoding UTF8

Write-Host "OK render.yaml cree" -ForegroundColor Green

# 2. Vérifier Dockerfile
if (Test-Path "Dockerfile") {
    Write-Host "OK Dockerfile existe" -ForegroundColor Green
} else {
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

# 3. Vérifier .dockerignore
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
"@ | Out-File -FilePath .dockerignore -Encoding UTF8
    Write-Host "OK .dockerignore cree" -ForegroundColor Green
}

# 4. Vérifier Git
Write-Host "`nVerification Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "Initialisation Git..." -ForegroundColor White
    git init
    git add .
    git commit -m "Initial commit for Render deployment"
    Write-Host "OK Git initialise" -ForegroundColor Green
} else {
    Write-Host "OK Git deja initialise" -ForegroundColor Green
}

# 5. Instructions déploiement
Write-Host "`nETAPES DEPLOIEMENT RENDER.COM:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Creer compte sur render.com (GRATUIT)" -ForegroundColor White
Write-Host "   URL: https://render.com" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Cliquer 'New +' > 'Web Service'" -ForegroundColor White
Write-Host ""
Write-Host "3. Connecter votre repo GitHub:" -ForegroundColor White
Write-Host "   - Si pas de repo: creer sur github.com" -ForegroundColor Gray
Write-Host "   - Push ce code: git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Render detecte Dockerfile automatiquement" -ForegroundColor White
Write-Host ""
Write-Host "5. Configurer:" -ForegroundColor White
Write-Host "   - Name: memolib-api" -ForegroundColor Gray
Write-Host "   - Plan: Free" -ForegroundColor Gray
Write-Host "   - Deploy!" -ForegroundColor Gray
Write-Host ""
Write-Host "6. URL finale: https://memolib-api.onrender.com" -ForegroundColor Cyan
Write-Host ""

# 6. Package Local
Write-Host "`nCREATION PACKAGE LOCAL (GRATUIT):" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$createPackage = Read-Host "Creer package client local? (o/n)"
if ($createPackage -eq "o") {
    Write-Host "Publication Release..." -ForegroundColor White
    dotnet publish -c Release -o MemoLib-Package-Client/app
    
    # Scripts installation
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

# 7. Résumé
Write-Host "`nRESUME:" -ForegroundColor Green
Write-Host "=======" -ForegroundColor Green
Write-Host "OK Fichiers Render.com prets" -ForegroundColor Green
Write-Host "OK Package local pret" -ForegroundColor Green
Write-Host ""
Write-Host "COUT TOTAL: 0 EUR (100% GRATUIT)" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROCHAINES ACTIONS:" -ForegroundColor Yellow
Write-Host "1. Deployer sur render.com (gratuit)" -ForegroundColor White
Write-Host "2. Tester demo en ligne" -ForegroundColor White
Write-Host "3. Appeler premiers prospects" -ForegroundColor White
Write-Host "4. Vendre installations locales (2,900 EUR)" -ForegroundColor White
Write-Host ""
Write-Host "Script termine." -ForegroundColor Gray