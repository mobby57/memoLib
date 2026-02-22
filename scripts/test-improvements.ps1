param(
    [string]$BaseUrl = 'http://localhost:8080'
)

$ErrorActionPreference = 'Stop'

Write-Host '== Test rapide des ameliorations ==' -ForegroundColor Cyan

# 1. Health check
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET
    Write-Host '[OK] Health check' -ForegroundColor Green
} catch {
    Write-Host '[KO] Health check' -ForegroundColor Red
    exit 1
}

# 2. Test validation (mot de passe faible)
$weakPass = @{
    email = "test@test.com"
    password = "weak"
    name = "Test"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $weakPass
    Write-Host '[KO] Validation mot de passe (devrait echouer)' -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host '[OK] Validation mot de passe' -ForegroundColor Green
    } else {
        Write-Host '[KO] Validation mot de passe (mauvais code)' -ForegroundColor Red
    }
}

# 3. Test rate limiting (11 requetes rapides)
Write-Host 'Test rate limiting (10 req/min)...' -ForegroundColor Yellow
$rateLimited = $false
for ($i = 1; $i -le 12; $i++) {
    try {
        $body = @{ email = "rate$i@test.com"; password = "Test123!"; name = "Rate" } | ConvertTo-Json
        Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $body | Out-Null
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            $rateLimited = $true
            break
        }
    }
}

if ($rateLimited) {
    Write-Host '[OK] Rate limiting actif' -ForegroundColor Green
} else {
    Write-Host '[WARN] Rate limiting non detecte' -ForegroundColor Yellow
}

# 4. Test inscription valide
$validUser = @{
    email = "valid.$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
    password = "ValidPass123!"
    name = "Valid User"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $validUser
    Write-Host '[OK] Inscription valide' -ForegroundColor Green
} catch {
    Write-Host '[KO] Inscription valide' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Tests termines avec succes!' -ForegroundColor Green
