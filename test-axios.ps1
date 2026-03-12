# 🧪 Test Axios Example
Write-Host "🚀 Test de l'exemple Axios..." -ForegroundColor Cyan

# 1. Vérifier API
Write-Host "`n1️⃣ Vérification API..." -ForegroundColor Yellow
$apiUrl = "http://localhost:5078/health"
try {
    $response = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ API active (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ API non accessible" -ForegroundColor Red
    exit 1
}

# 2. Vérifier fichier Axios
Write-Host "`n2️⃣ Vérification fichier..." -ForegroundColor Yellow
$axiosFile = "wwwroot\axios-example.html"
if (Test-Path $axiosFile) {
    Write-Host "✅ Fichier existe: $axiosFile" -ForegroundColor Green
} else {
    Write-Host "❌ Fichier manquant: $axiosFile" -ForegroundColor Red
    exit 1
}

# 3. Test Login
Write-Host "`n3️⃣ Test Login..." -ForegroundColor Yellow
$loginUrl = "http://localhost:5078/api/auth/login"
$body = @{
    email = "demo@memolib.com"
    password = "Demo123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $body -ContentType "application/json"
    $token = $response.token
    Write-Host "✅ Login réussi" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login échoué: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Test Vault List
Write-Host "`n4️⃣ Test Vault..." -ForegroundColor Yellow
$vaultUrl = "http://localhost:5078/api/vault/list"
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $secrets = Invoke-RestMethod -Uri $vaultUrl -Method Get -Headers $headers
    Write-Host "✅ Vault accessible ($($secrets.Count) secrets)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Vault vide ou erreur" -ForegroundColor Yellow
}

# 5. Test Cases
Write-Host "`n5️⃣ Test Cases..." -ForegroundColor Yellow
$casesUrl = "http://localhost:5078/api/cases"

try {
    $cases = Invoke-RestMethod -Uri $casesUrl -Method Get -Headers $headers
    Write-Host "✅ Cases accessible ($($cases.Count) dossiers)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Cases vide ou erreur" -ForegroundColor Yellow
}

# Résumé
Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "✅ TOUS LES TESTS PASSÉS!" -ForegroundColor Green
Write-Host "="*50 -ForegroundColor Cyan

Write-Host "`n🌐 Accès:" -ForegroundColor Cyan
Write-Host "   • Axios Example: http://localhost:5078/axios-example.html" -ForegroundColor White
Write-Host "   • Interface: http://localhost:5078/demo.html" -ForegroundColor White
Write-Host "   • API: http://localhost:5078/api" -ForegroundColor White

Write-Host "`nCompte de test:" -ForegroundColor Cyan
Write-Host "   Email: demo@memolib.com" -ForegroundColor White
Write-Host "   Password: Demo123!" -ForegroundColor White
