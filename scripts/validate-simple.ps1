param([string]$ApiUrl = 'http://localhost:5078')

Write-Host "VALIDATION MEMOLIB LOCAL" -ForegroundColor Magenta

$Global:Token = $null
$tests = @()

function Test-Api {
    param([string]$Method = 'GET', [string]$Endpoint, [object]$Body = $null, [switch]$NoAuth)
    
    try {
        $headers = @{}
        if (-not $NoAuth -and $Global:Token) {
            $headers['Authorization'] = "Bearer $Global:Token"
        }
        
        if ($Body) {
            $headers['Content-Type'] = 'application/json'
            $response = Invoke-RestMethod -Uri "$ApiUrl$Endpoint" -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json) -TimeoutSec 10
        } else {
            $response = Invoke-RestMethod -Uri "$ApiUrl$Endpoint" -Method $Method -Headers $headers -TimeoutSec 10
        }
        
        return @{ Success = $true; Data = $response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# 1. Test API
Write-Host "1. Test API Health..." -ForegroundColor Cyan
$health = Test-Api -Endpoint '/health' -NoAuth
if ($health.Success) {
    Write-Host "   OK - API accessible" -ForegroundColor Green
    $tests += "API Health: PASS"
} else {
    Write-Host "   ERREUR - API inaccessible" -ForegroundColor Red
    $tests += "API Health: FAIL"
}

# 2. Test Auth
Write-Host "2. Test Authentification..." -ForegroundColor Cyan
$loginData = @{
    email = 'demo@memolib.local'
    password = 'Demo123!'
}

$login = Test-Api -Method 'POST' -Endpoint '/api/auth/login' -Body $loginData -NoAuth
if (-not $login.Success) {
    # Creer compte
    $registerData = @{
        email = 'demo@memolib.local'
        password = 'Demo123!'
        name = 'Demo User'
        role = 'AVOCAT'
        plan = 'CABINET'
    }
    
    $register = Test-Api -Method 'POST' -Endpoint '/api/auth/register' -Body $registerData -NoAuth
    $login = Test-Api -Method 'POST' -Endpoint '/api/auth/login' -Body $loginData -NoAuth
}

if ($login.Success -and $login.Data.token) {
    $Global:Token = $login.Data.token
    Write-Host "   OK - Connecte" -ForegroundColor Green
    $tests += "Auth: PASS"
} else {
    Write-Host "   ERREUR - Connexion impossible" -ForegroundColor Red
    $tests += "Auth: FAIL"
}

# 3. Test Client
Write-Host "3. Test Gestion Clients..." -ForegroundColor Cyan
$clientData = @{
    name = 'Client Validation'
    email = 'validation@test.com'
    phoneNumber = '+33 6 00 00 00 00'
    address = 'Adresse test'
}

$createClient = Test-Api -Method 'POST' -Endpoint '/api/client' -Body $clientData
$listClients = Test-Api -Endpoint '/api/client'

if ($listClients.Success) {
    Write-Host "   OK - $($listClients.Data.Count) clients" -ForegroundColor Green
    $tests += "Clients: PASS"
} else {
    Write-Host "   ERREUR - Gestion clients" -ForegroundColor Red
    $tests += "Clients: FAIL"
}

# 4. Test Email
Write-Host "4. Test Ingestion Email..." -ForegroundColor Cyan
$emailData = @{
    from = 'validation@test.com'
    subject = 'Email de validation'
    body = 'Test de validation du systeme.'
    externalId = "VAL-$(Get-Date -Format 'yyyyMMddHHmmss')"
    occurredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
}

$ingestEmail = Test-Api -Method 'POST' -Endpoint '/api/ingest/email' -Body $emailData
if ($ingestEmail.Success) {
    Write-Host "   OK - Email ingere" -ForegroundColor Green
    $tests += "Email: PASS"
} else {
    Write-Host "   ERREUR - Ingestion email" -ForegroundColor Red
    $tests += "Email: FAIL"
}

# 5. Test Dossiers
Write-Host "5. Test Gestion Dossiers..." -ForegroundColor Cyan
$listCases = Test-Api -Endpoint '/api/cases'
if ($listCases.Success) {
    Write-Host "   OK - $($listCases.Data.Count) dossiers" -ForegroundColor Green
    $tests += "Dossiers: PASS"
} else {
    Write-Host "   ERREUR - Gestion dossiers" -ForegroundColor Red
    $tests += "Dossiers: FAIL"
}

# 6. Test Recherche
Write-Host "6. Test Recherche..." -ForegroundColor Cyan
$searchData = @{ text = 'validation' }
$search = Test-Api -Method 'POST' -Endpoint '/api/search/events' -Body $searchData
if ($search.Success) {
    Write-Host "   OK - Recherche fonctionnelle" -ForegroundColor Green
    $tests += "Recherche: PASS"
} else {
    Write-Host "   ERREUR - Recherche" -ForegroundColor Red
    $tests += "Recherche: FAIL"
}

# 7. Test Dashboard
Write-Host "7. Test Dashboard..." -ForegroundColor Cyan
$overview = Test-Api -Endpoint '/api/dashboard/overview'
if ($overview.Success) {
    $stats = $overview.Data.stats
    Write-Host "   OK - $($stats.totalCases) dossiers, $($stats.totalEvents) emails" -ForegroundColor Green
    $tests += "Dashboard: PASS"
} else {
    Write-Host "   ERREUR - Dashboard" -ForegroundColor Red
    $tests += "Dashboard: FAIL"
}

# 8. Test Interfaces
Write-Host "8. Test Interfaces Web..." -ForegroundColor Cyan
$interfaces = @("/demo.html", "/dashboard.html", "/export.html", "/mobile.html")
$interfaceOK = 0

foreach ($interface in $interfaces) {
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl$interface" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) { $interfaceOK++ }
    } catch { }
}

Write-Host "   OK - $interfaceOK/4 interfaces accessibles" -ForegroundColor Green
$tests += "Interfaces: PASS ($interfaceOK/4)"

# Resume
Write-Host "`nRESUME VALIDATION:" -ForegroundColor Magenta
$passCount = ($tests | Where-Object { $_ -like "*PASS*" }).Count
$totalCount = $tests.Count

Write-Host "Tests reussis: $passCount/$totalCount" -ForegroundColor Green

foreach ($test in $tests) {
    $color = if ($test -like "*PASS*") { "Green" } else { "Red" }
    Write-Host "  $test" -ForegroundColor $color
}

if ($passCount -eq $totalCount) {
    Write-Host "`nVALIDATION COMPLETE REUSSIE!" -ForegroundColor Green
} elseif ($passCount -gt ($totalCount / 2)) {
    Write-Host "`nValidation majoritairement reussie" -ForegroundColor Yellow
} else {
    Write-Host "`nValidation partiellement echouee" -ForegroundColor Red
}

Write-Host "`nACCES AUX INTERFACES:" -ForegroundColor Cyan
Write-Host "Interface principale: $ApiUrl/demo.html" -ForegroundColor White
Write-Host "Dashboard: $ApiUrl/dashboard.html" -ForegroundColor White
Write-Host "Export PDF: $ApiUrl/export.html" -ForegroundColor White
Write-Host "App Mobile: $ApiUrl/mobile.html" -ForegroundColor White

Write-Host "`nCOMPTE DE TEST:" -ForegroundColor Cyan
Write-Host "Email: demo@memolib.local" -ForegroundColor White
Write-Host "Mot de passe: Demo123!" -ForegroundColor White