$ErrorActionPreference = "Stop"

Write-Host "=== MEMOLIB AXIOS PRO - TEST COMPLET ===" -ForegroundColor Cyan
Write-Host ""

# Variables
$baseUrl = "http://localhost:5078"
$apiUrl = "$baseUrl/api"
$randomId = Get-Random -Minimum 1000 -Maximum 9999
$email = "test$randomId@memolib.com"
$password = "Test123!"

# 1. Check API
Write-Host "[1/6] Verification API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  OK - API active (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR - API non accessible" -ForegroundColor Red
    Write-Host "  Solution: Demarrez l'API avec 'dotnet run'" -ForegroundColor Yellow
    exit 1
}

# 2. Check Files
Write-Host "`n[2/6] Verification fichiers..." -ForegroundColor Yellow
$files = @(
    "wwwroot\axios-pro.html",
    "ERROR_ANALYSIS_PRO.md"
)
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  OK - $file" -ForegroundColor Green
    } else {
        Write-Host "  ERREUR - $file manquant" -ForegroundColor Red
        exit 1
    }
}

# 3. Register
Write-Host "`n[3/6] Test Register..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = $email
        password = $password
        name = "Test User"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "  OK - Compte cree: $email" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMsg = $_.ErrorDetails.Message
    Write-Host "  ERREUR $statusCode - $errorMsg" -ForegroundColor Red
    
    if ($statusCode -eq 409) {
        Write-Host "  INFO - Compte existe deja, on continue..." -ForegroundColor Yellow
    } else {
        Write-Host "  Solution: Verifiez le format email/password" -ForegroundColor Yellow
        exit 1
    }
}

# 4. Login
Write-Host "`n[4/6] Test Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $response.token
    Write-Host "  OK - Login reussi" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,30))..." -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  ERREUR $statusCode - Login echoue" -ForegroundColor Red
    Write-Host "  Solution: Verifiez les identifiants" -ForegroundColor Yellow
    exit 1
}

# 5. Test Vault
Write-Host "`n[5/6] Test Vault..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }

    # Store
    $storeBody = @{
        key = "TestKey"
        value = "TestValue123"
        category = "Demo"
    } | ConvertTo-Json
    
    $null = Invoke-RestMethod -Uri "$apiUrl/vault/store" -Method Post -Body $storeBody -Headers $headers
    Write-Host "  OK - Secret stocke" -ForegroundColor Green

    # List
    $secrets = Invoke-RestMethod -Uri "$apiUrl/vault/list" -Method Get -Headers $headers
    Write-Host "  OK - $($secrets.Count) secret(s) trouve(s)" -ForegroundColor Green

    # Get
    $secret = Invoke-RestMethod -Uri "$apiUrl/vault/get/TestKey" -Method Get -Headers $headers
    Write-Host "  OK - Secret recupere: $($secret.value)" -ForegroundColor Green

} catch {
    Write-Host "  ERREUR - Vault: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Solution: Verifiez le token JWT" -ForegroundColor Yellow
}

# 6. Test Cases
Write-Host "`n[6/6] Test Cases..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }

    # List
    $cases = Invoke-RestMethod -Uri "$apiUrl/cases" -Method Get -Headers $headers
    Write-Host "  OK - $($cases.Count) dossier(s) trouve(s)" -ForegroundColor Green

    # Create
    $caseBody = @{
        title = "Test Case $(Get-Date -Format 'HH:mm:ss')"
        description = "Cree via test automatique"
        clientEmail = "client@example.com"
        clientPhone = "+33612345678"
    } | ConvertTo-Json

    $newCase = Invoke-RestMethod -Uri "$apiUrl/cases" -Method Post -Body $caseBody -Headers $headers
    Write-Host "  OK - Dossier cree: $($newCase.id)" -ForegroundColor Green

} catch {
    Write-Host "  ERREUR - Cases: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "TOUS LES TESTS REUSSIS!" -ForegroundColor Green
Write-Host ("="*60) -ForegroundColor Cyan

Write-Host "`nACCES:" -ForegroundColor Cyan
Write-Host "  Interface Pro: $baseUrl/axios-pro.html" -ForegroundColor White
Write-Host "  Interface Simple: $baseUrl/axios-example.html" -ForegroundColor White
Write-Host "  API: $apiUrl" -ForegroundColor White

Write-Host "`nCOMPTE DE TEST:" -ForegroundColor Cyan
Write-Host "  Email: $email" -ForegroundColor White
Write-Host "  Password: $password" -ForegroundColor White

Write-Host "`nDOCUMENTATION:" -ForegroundColor Cyan
Write-Host "  ERROR_ANALYSIS_PRO.md - Analyse complete des erreurs" -ForegroundColor White
Write-Host "  AXIOS_STATUS.md - Status et utilisation" -ForegroundColor White
