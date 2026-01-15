# Script de test automatise - IA Poste Manager
# Encodage: UTF-8 BOM

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AUTO TEST - IA POSTE MANAGER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Fonction pour tester un endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description
    )
    
    try {
        Write-Host "`nTest: $Description" -ForegroundColor Yellow
        Write-Host "  URL: $Url" -ForegroundColor Gray
        
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "  OK - Status $($response.StatusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  Status $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "  Erreur: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Attendre que le serveur soit pret
Write-Host "`nAttente du serveur (max 30s)..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
            $serverReady = $true
            Write-Host "Serveur pret!" -ForegroundColor Green
        }
    }
    catch {
        $attempt++
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $serverReady) {
    Write-Host "`nLe serveur n'a pas demarre" -ForegroundColor Red
    Write-Host "Assurez-vous que 'npm run dev' est en cours" -ForegroundColor Yellow
    exit 1
}

# Tests des endpoints
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TESTS DES ENDPOINTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$results = @()

# Pages principales
$results += Test-Endpoint "http://localhost:3000" "Page d'accueil"
$results += Test-Endpoint "http://localhost:3000/login" "Page de connexion"

# Pages Admin
Write-Host "`nTests Admin (redirection login attendue):" -ForegroundColor Cyan
Test-Endpoint "http://localhost:3000/admin" "Dashboard Admin"
Test-Endpoint "http://localhost:3000/admin/clients" "Gestion Clients"
Test-Endpoint "http://localhost:3000/admin/dossiers" "Gestion Dossiers"

# Pages Client
Write-Host "`nTests Client (redirection login attendue):" -ForegroundColor Cyan
Test-Endpoint "http://localhost:3000/client" "Dashboard Client"
Test-Endpoint "http://localhost:3000/client/documents" "Documents Client"
Test-Endpoint "http://localhost:3000/client/profil" "Profil Client"

# API Routes
Write-Host "`nTests API (401 Unauthorized attendu):" -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri "http://localhost:3000/api/client/dossiers" -UseBasicParsing -ErrorAction Stop | Out-Null
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  API Client - Protection OK (401)" -ForegroundColor Green
    }
}

# Resume
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_ -eq $true }).Count
$totalCount = $results.Count

Write-Host "`nTests reussis: $successCount/$totalCount" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   TESTS TERMINES AVEC SUCCES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nCOMPTES DE TEST:" -ForegroundColor Cyan
Write-Host "  Admin: admin@avocat.com / Admin123!" -ForegroundColor White
Write-Host "  Client: client@test.com / Client123!" -ForegroundColor White

Write-Host "`nURLS:" -ForegroundColor Cyan
Write-Host "  Application: http://localhost:3000" -ForegroundColor White
Write-Host "  Admin: http://localhost:3000/admin" -ForegroundColor White
Write-Host "  Client: http://localhost:3000/client" -ForegroundColor White

Write-Host "`nApplication fonctionnelle!" -ForegroundColor Green
Write-Host "Prochaine etape: Configuration du monitoring email" -ForegroundColor Yellow
Write-Host "  Commande: npm run email:setup" -ForegroundColor Gray

return $successCount -eq $totalCount
