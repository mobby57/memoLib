$API = "http://localhost:5078/api"
$email = "diag@test.com"
$password = "Test123!"

Write-Host "1. Register"
try {
    $body = @{ email=$email; password=$password; name="Diag" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$API/auth/register" -Method Post -Body $body -ContentType "application/json" | Out-Null
} catch { }

Write-Host "2. Login"
$body = @{ email=$email; password=$password } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "$API/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $res.token

Write-Host "Token: $($token.Substring(0,50))..."
Write-Host ""
Write-Host "3. Test avec curl"
Write-Host ""

$curlCmd = "curl -X GET `"$API/cases`" -H `"Authorization: Bearer $token`""
Write-Host $curlCmd
Write-Host ""

Invoke-Expression $curlCmd
