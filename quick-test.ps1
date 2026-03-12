$email = "axios$(Get-Random)@test.com"
$password = "Test123!"

Write-Host "Creating account: $email"

# Register
$registerBody = @{
    email = $email
    password = $password
    fullName = "Axios Test"
} | ConvertTo-Json

$null = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
Write-Host "OK - Registered"

# Login
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
Write-Host "OK - Logged in"
Write-Host "Token: $($response.token.Substring(0,30))..."

# Test Vault
$headers = @{ Authorization = "Bearer $($response.token)" }
$secrets = Invoke-RestMethod -Uri "http://localhost:5078/api/vault/list" -Method Get -Headers $headers
Write-Host "OK - Vault: $($secrets.Count) secrets"

# Test Cases
$cases = Invoke-RestMethod -Uri "http://localhost:5078/api/cases" -Method Get -Headers $headers
Write-Host "OK - Cases: $($cases.Count) cases"

Write-Host "`nSUCCESS! All tests passed."
Write-Host "`nOpen: http://localhost:5078/axios-example.html"
