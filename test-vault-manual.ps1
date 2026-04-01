# Test manuel Vault

$API_URL = "http://localhost:5078"

# 1. Login
Write-Host "Login..." -ForegroundColor Cyan
$loginBody = @{
    email = "vault-demo-20260309111310@memolib.local"
    password = "Demo2025!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginResponse.token
Write-Host "Token: $($token.Substring(0,50))...`n" -ForegroundColor Green

# 2. Test Vault
Write-Host "Test Vault..." -ForegroundColor Cyan
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

$vaultBody = @{
    key = "test-key"
    value = "test-value"
    category = "Test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/vault/store" -Method Post -Headers $headers -Body $vaultBody -UseBasicParsing
    Write-Host "SUCCESS: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "ERROR: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response: $responseBody" -ForegroundColor Yellow
}

pause
