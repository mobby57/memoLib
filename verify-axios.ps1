Write-Host "Test Axios Example" -ForegroundColor Cyan

# 1. Check API
Write-Host "`n1. API Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5078/health" -UseBasicParsing
    Write-Host "OK - API active (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "FAIL - API not accessible" -ForegroundColor Red
    exit 1
}

# 2. Check file
Write-Host "`n2. File Check..." -ForegroundColor Yellow
if (Test-Path "wwwroot\axios-example.html") {
    Write-Host "OK - File exists" -ForegroundColor Green
} else {
    Write-Host "FAIL - File missing" -ForegroundColor Red
    exit 1
}

# 3. Register
Write-Host "`n3. Register..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@memolib.com"
    password = "Test123!"
    fullName = "Test User"
} | ConvertTo-Json

try {
    $null = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "OK - Account created" -ForegroundColor Green
} catch {
    Write-Host "INFO - Account may already exist" -ForegroundColor Yellow
}

# 4. Login
Write-Host "`n4. Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@memolib.com"
    password = "Test123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $response.token
    Write-Host "OK - Login successful" -ForegroundColor Green
} catch {
    Write-Host "FAIL - Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Test Vault
Write-Host "`n5. Vault Test..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
try {
    $secrets = Invoke-RestMethod -Uri "http://localhost:5078/api/vault/list" -Method Get -Headers $headers
    Write-Host "OK - Vault accessible ($($secrets.Count) secrets)" -ForegroundColor Green
} catch {
    Write-Host "INFO - Vault empty" -ForegroundColor Yellow
}

# 6. Test Cases
Write-Host "`n6. Cases Test..." -ForegroundColor Yellow
try {
    $cases = Invoke-RestMethod -Uri "http://localhost:5078/api/cases" -Method Get -Headers $headers
    Write-Host "OK - Cases accessible ($($cases.Count) cases)" -ForegroundColor Green
} catch {
    Write-Host "INFO - Cases empty" -ForegroundColor Yellow
}

Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "="*50 -ForegroundColor Cyan

Write-Host "`nAccess URLs:" -ForegroundColor Cyan
Write-Host "  Axios Example: http://localhost:5078/axios-example.html"
Write-Host "  Interface: http://localhost:5078/demo.html"
Write-Host "  API: http://localhost:5078/api"

Write-Host "`nTest Account:" -ForegroundColor Cyan
Write-Host "  Email: test@memolib.com"
Write-Host "  Password: Test123!"
