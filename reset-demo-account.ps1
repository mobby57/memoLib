# Reset compte demo

Write-Host "Reset compte demo..." -ForegroundColor Yellow

$API_URL = "http://localhost:5078"

# Supprimer ancien compte (via DB directement)
Write-Host "Suppression ancien compte dans la DB..."

# Recréer avec bon mot de passe
Write-Host "Creation nouveau compte..."
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/auth/register" -Method Post -ContentType "application/json" -Body '{"email":"sarraboudjellal57@gmail.com","password":"Demo2025!","name":"Demo Account"}'
    Write-Host "Compte cree avec succes" -ForegroundColor Green
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# Tester login
Write-Host "`nTest login..."
try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"sarraboudjellal57@gmail.com","password":"Demo2025!"}'
    Write-Host "Login OK - Token: $($loginResponse.token.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "Login FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

pause
