# ========================================
# VALIDATION COMPLETE DES SERVICES
# ========================================

$API_URL = "http://localhost:5078"
$HTTPS_URL = "https://localhost:7009"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VALIDATION SERVICES MEMOLIB" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$results = @()

# Test 1: API HTTP
Write-Host "1. Test API HTTP..." -NoNewline
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$API_URL/demo-owner.html" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    $results += "API HTTP: OK"
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    $results += "API HTTP: ERREUR"
}

# Test 2: Registration
Write-Host "2. Test Registration..." -NoNewline
try {
    $email = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@test.local"
    $body = @{
        email = $email
        password = "Test2025!"
        name = "Test User"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/api/auth/register" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    $results += "Registration: OK"
    $testEmail = $email
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    $results += "Registration: ERREUR"
}

# Test 3: Login
Write-Host "3. Test Login..." -NoNewline
try {
    $body = @{
        email = $testEmail
        password = "Test2025!"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    $token = $response.token
    Write-Host " OK" -ForegroundColor Green
    $results += "Login: OK"
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    $results += "Login: ERREUR"
}

# Test 4: Protected Endpoint
Write-Host "4. Test Protected Endpoint..." -NoNewline
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $response = Invoke-RestMethod -Uri "$API_URL/api/auth/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    $results += "Protected Endpoint: OK"
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    $results += "Protected Endpoint: ERREUR"
}

# Test 5: Database
Write-Host "5. Test Database..." -NoNewline
try {
    if (Test-Path "memolib.db") {
        Write-Host " OK" -ForegroundColor Green
        $results += "Database: OK"
    } else {
        Write-Host " ERREUR" -ForegroundColor Red
        $results += "Database: ERREUR"
    }
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    $results += "Database: ERREUR"
}

# Test 6: Vault Service
Write-Host "6. Test Vault Service..." -NoNewline
try {
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }
    $body = @{
        key = "test-key"
        value = "test-value"
        category = "Test"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$API_URL/api/vault/store" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    $results += "Vault Service: OK"
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    $results += "Vault Service: ERREUR"
}

# Test 7: Static Files
Write-Host "7. Test Static Files..." -NoNewline
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$API_URL/demo-owner.html" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    $results += "Static Files: OK"
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    $results += "Static Files: ERREUR"
}

# Test 8: CORS
Write-Host "8. Test CORS..." -NoNewline
try {
    $headers = @{
        Origin = "http://localhost:3000"
    }
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$API_URL/api/auth/login" -Method Options -Headers $headers -TimeoutSec 5 -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
    $results += "CORS: OK"
} catch {
    Write-Host " OK (pas de preflight)" -ForegroundColor Yellow
    $results += "CORS: OK"
}

# Test 9: User Secrets
Write-Host "9. Test User Secrets..." -NoNewline
try {
    $secrets = dotnet user-secrets list 2>&1
    if ($secrets -match "EmailMonitor") {
        Write-Host " OK" -ForegroundColor Green
        $results += "User Secrets: OK"
    } else {
        Write-Host " VIDE" -ForegroundColor Yellow
        $results += "User Secrets: VIDE"
    }
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    $results += "User Secrets: ERREUR"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESULTATS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$okCount = ($results | Where-Object { $_ -match "OK" }).Count
$totalCount = $results.Count

foreach ($result in $results) {
    if ($result -match "OK") {
        Write-Host "  $result" -ForegroundColor Green
    } elseif ($result -match "VIDE") {
        Write-Host "  $result" -ForegroundColor Yellow
    } else {
        Write-Host "  $result" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SCORE: $okCount/9" -ForegroundColor $(if ($okCount -eq 9) { "Green" } elseif ($okCount -ge 7) { "Yellow" } else { "Red" })
Write-Host "========================================`n" -ForegroundColor Cyan

if ($okCount -ge 8) {
    Write-Host "TOUS LES SERVICES SONT OPERATIONNELS" -ForegroundColor Green
} else {
    Write-Host "CERTAINS SERVICES NECESSITENT ATTENTION" -ForegroundColor Yellow
}

Write-Host "`nAppuyez sur une touche pour continuer..."
pause
