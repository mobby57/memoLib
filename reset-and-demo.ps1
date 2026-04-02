$ErrorActionPreference = 'Stop'

Write-Host "Reinitialisation du compte sarraboudjellal57@gmail.com" -ForegroundColor Cyan

# Supprimer l'ancienne base
if (Test-Path "memolib.db") {
    Write-Host "Suppression de l'ancienne base..." -ForegroundColor Yellow
    Remove-Item "memolib.db" -Force
}

# Recréer la base
Write-Host "Création de la nouvelle base..." -ForegroundColor Yellow
dotnet ef database update

Write-Host "Base de donnees reinitialisee!" -ForegroundColor Green
Write-Host ""
Write-Host "Compte créé automatiquement au démarrage:" -ForegroundColor Cyan
Write-Host "  Email: sarraboudjellal57@gmail.com" -ForegroundColor White
Write-Host "  Password: SecurePass123!" -ForegroundColor White
Write-Host ""
Write-Host "Demarrage de l'API..." -ForegroundColor Yellow

# Démarrer l'API
Start-Process -FilePath "dotnet" -ArgumentList "run --urls http://localhost:5078" -WorkingDirectory "." -WindowStyle Hidden

Write-Host "Attente du demarrage (10 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Tester la connexion
Write-Host "Test de connexion..." -ForegroundColor Yellow
$body = @{
    email = "sarraboudjellal57@gmail.com"
    password = "SecurePass123!"
    name = "Sarra Boudjellal"
    role = "AVOCAT"
    plan = "CABINET"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Compte cree avec succes!" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "Compte existe deja!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test login
$loginBody = @{
    email = "sarraboudjellal57@gmail.com"
    password = "SecurePass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "Connexion reussie!" -ForegroundColor Green
    Write-Host "Token: $($loginResponse.token.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 Ouvrir: http://localhost:5078/demo.html" -ForegroundColor Cyan
Write-Host "🎬 Cliquer sur le bouton 'DÉMO AUTO' pour lancer la démo" -ForegroundColor Cyan

# Ouvrir le navigateur
Start-Process "http://localhost:5078/demo.html"