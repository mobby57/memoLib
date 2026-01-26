#!/usr/bin/env pwsh
# Script de test automatise - IA Poste Manager

Write-Output "========================================"
Write-Output "   AUTO TEST - IA POSTE MANAGER"
Write-Output "========================================"

# Fonction pour tester un endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description
    )
    
    try {
        Write-Output ""
        Write-Output "[TEST] $Description"
        Write-Output "   URL: $Url"
        
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Output "   [OK] Status $($response.StatusCode)"
            return $true
        } else {
            Write-Output "   [WARN] Status $($response.StatusCode)"
            return $false
        }
    }
    catch {
        Write-Output "   [ERREUR] $($_.Exception.Message)"
        return $false
    }
}

# Attendre que le serveur soit pret
Write-Output ""
Write-Output "[WAIT] Attente du serveur (max 30s)..."
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
            $serverReady = $true
            Write-Output "[OK] Serveur pret!"
        }
    }
    catch {
        $attempt++
        Start-Sleep -Seconds 1
        Write-Output "." -NoNewline
    }
}

if (-not $serverReady) {
    Write-Output ""
    Write-Output "[ERREUR] Le serveur n'a pas demarre dans les temps"
    Write-Output "Assurez-vous que 'npm run dev' est en cours d'execution"
    exit 1
}

# Tests des endpoints
Write-Output ""
Write-Output "========================================"
Write-Output "   TESTS DES ENDPOINTS"
Write-Output "========================================"

$results = @()

# Pages principales
$results += Test-Endpoint "http://localhost:3000" "Page d'accueil"
$results += Test-Endpoint "http://localhost:3000/login" "Page de connexion"

# Pages Admin (peuvent rediriger vers login)
Write-Output ""
Write-Output "[ADMIN] Tests Admin (redirection login attendue):"
Test-Endpoint "http://localhost:3000/admin" "Dashboard Admin"
Test-Endpoint "http://localhost:3000/admin/clients" "Gestion Clients"
Test-Endpoint "http://localhost:3000/admin/dossiers" "Gestion Dossiers"
Test-Endpoint "http://localhost:3000/admin/documents" "Documents Admin"
Test-Endpoint "http://localhost:3000/admin/messages" "Messages Admin"

# API Endpoints
Write-Output ""
Write-Output "[API] Tests API Endpoints:"
Test-Endpoint "http://localhost:3000/api/health" "Health Check"
Test-Endpoint "http://localhost:3000/api/status" "Status API"

# Resultats
$successCount = ($results | Where-Object { $_ -eq $true }).Count
$totalCount = $results.Count

Write-Output ""
Write-Output "========================================"
Write-Output "   RESUME DES TESTS"
Write-Output "========================================"
Write-Output "   Reussis: $successCount/$totalCount"

if ($successCount -eq $totalCount) {
    Write-Output "[OK] Tous les tests ont reussi!"
    exit 0
} else {
    Write-Output "[WARN] Certains tests ont echoue"
    exit 1
}
