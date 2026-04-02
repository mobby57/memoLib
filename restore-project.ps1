# Restauration du projet MemoLib depuis Git

Write-Host "=== Restauration MemoLib ===" -ForegroundColor Cyan

# Vérifier si on est dans le bon dossier
if (-not (Test-Path "MemoLib.Api.csproj")) {
    Write-Host "Erreur: Exécutez ce script depuis le dossier MemoLib.Api" -ForegroundColor Red
    exit 1
}

Write-Host "`n1. Restauration des packages NuGet..." -ForegroundColor Yellow
dotnet restore

Write-Host "`n2. Création de la base de données..." -ForegroundColor Yellow
dotnet ef database update

Write-Host "`n3. Compilation du projet..." -ForegroundColor Yellow
dotnet build

Write-Host "`n4. Configuration des secrets utilisateur..." -ForegroundColor Yellow
Write-Host "Configurez votre mot de passe email:" -ForegroundColor White
$emailPassword = Read-Host "Mot de passe d'application Gmail" -AsSecureString
$emailPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword))
dotnet user-secrets set "EmailMonitor:Password" $emailPasswordPlain

Write-Host "`n=== Restauration terminée ===" -ForegroundColor Green
Write-Host "`nPour lancer l'application:" -ForegroundColor Yellow
Write-Host "  dotnet run" -ForegroundColor Cyan
Write-Host "`nAPI: http://localhost:5078" -ForegroundColor White
Write-Host "Interface: http://localhost:5078/demo.html" -ForegroundColor White
