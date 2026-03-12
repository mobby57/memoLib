$ErrorActionPreference = "Stop"

Write-Host "=== TEST AUTOMATIQUE MEMOLIB ===" -ForegroundColor Cyan

$API = "http://localhost:5078/api"
$email = "test$(Get-Random)@test.com"
$password = "Test123!"

# 1. Register
Write-Host "`n[1/4] Register..." -ForegroundColor Yellow
$body = @{ email=$email; password=$password; name="Test" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "$API/auth/register" -Method Post -Body $body -ContentType "application/json"
Write-Host "OK - ID: $($res.id)" -ForegroundColor Green

# 2. Login
Write-Host "`n[2/4] Login..." -ForegroundColor Yellow
$body = @{ email=$email; password=$password } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "$API/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $res.token
Write-Host "OK - Token: $($token.Substring(0,30))..." -ForegroundColor Green

# 3. Vault
Write-Host "`n[3/4] Vault..." -ForegroundColor Yellow
$headers = @{ Authorization="Bearer $token"; "Content-Type"="application/json" }
$body = @{ key="test"; value="value123"; category="demo" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "$API/vault/store" -Method Post -Body $body -Headers $headers
Write-Host "OK - Secret stored" -ForegroundColor Green

# 4. Cases
Write-Host "`n[4/4] Cases..." -ForegroundColor Yellow
$res = Invoke-RestMethod -Uri "$API/cases" -Method Get -Headers $headers
Write-Host "OK - $($res.Count) cases" -ForegroundColor Green

Write-Host "`n=== TOUS LES TESTS REUSSIS ===" -ForegroundColor Green
Write-Host "`nCompte: $email / $password" -ForegroundColor Cyan
Write-Host "Interface: http://localhost:5078/test.html" -ForegroundColor Cyan
