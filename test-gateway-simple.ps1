Write-Host "Test Universal Gateway" -ForegroundColor Cyan

$baseUrl = "http://localhost:5078"
$apiKey = "memolib-gateway-2025-secure-key"

Write-Host "1. Register user..."
$registerBody = '{"email":"gateway@test.com","password":"Test123!","name":"Gateway Test"}'
try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" | Out-Null
    Write-Host "OK" -ForegroundColor Green
} catch {
    Write-Host "User exists (OK)" -ForegroundColor Yellow
}

Write-Host "2. Login..."
$loginBody = '{"email":"gateway@test.com","password":"Test123!"}'
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $login.token
Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Green

Write-Host "3. Ingest messages..."
$messages = @(
    '{
        "channel":"email",
        "from":"client@example.com",
        "fromName":"Jean",
        "text":"Test email",
        "externalId":"e1",
        "metadata":{}
    }',
    '{
        "channel":"sms",
        "from":"+33612345678",
        "fromName":"Marie",
        "text":"Test SMS",
        "externalId":"s1",
        "metadata":{}
    }',
    '{
        "channel":"whatsapp",
        "from":"+33698765432",
        "fromName":"Pierre",
        "text":"Test WhatsApp",
        "externalId":"w1",
        "metadata":{}
    }'
)

foreach ($msg in $messages) {
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "X-API-Key" = $apiKey
        }
        Invoke-RestMethod -Uri "$baseUrl/api/gateway/ingest" -Method Post -Body $msg -Headers $headers | Out-Null
        Write-Host "  OK" -ForegroundColor Green
    } catch {
        Write-Host "  FAIL" -ForegroundColor Red
    }
}

Write-Host "4. Get inbox..."
$headers = @{ Authorization = "Bearer $token" }
$inbox = Invoke-RestMethod -Uri "$baseUrl/api/gateway/inbox?limit=10" -Method Get -Headers $headers
Write-Host "Messages: $($inbox.Count)" -ForegroundColor Green

Write-Host "5. Test invalid channel..."
$invalid = '{
    "channel":"invalid",
    "from":"test@test.com",
    "fromName":"Test",
    "text":"Fail",
    "externalId":"f1",
    "metadata":{}
}'
try {
    $headers = @{
        "Content-Type" = "application/json"
        "X-API-Key" = $apiKey
    }
    Invoke-RestMethod -Uri "$baseUrl/api/gateway/ingest" -Method Post -Body $invalid -Headers $headers | Out-Null
    Write-Host "FAIL (should reject)" -ForegroundColor Red
} catch {
    Write-Host "OK (rejected)" -ForegroundColor Green
}

Write-Host "6. Test missing API key..."
$test = '{
    "channel":"email",
    "from":"test@test.com",
    "fromName":"Test",
    "text":"Fail",
    "externalId":"f2",
    "metadata":{}
}'
try {
    Invoke-RestMethod -Uri "$baseUrl/api/gateway/ingest" -Method Post -Body $test -ContentType "application/json" | Out-Null
    Write-Host "FAIL (should reject)" -ForegroundColor Red
} catch {
    Write-Host "OK (rejected)" -ForegroundColor Green
}

Write-Host ""
Write-Host "All tests completed!" -ForegroundColor Cyan
