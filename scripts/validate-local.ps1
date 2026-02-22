param([string]$ApiUrl = 'http://localhost:5078')

$ErrorActionPreference = 'Continue'

Write-Host "🔍 VALIDATION COMPLETE MEMOLIB LOCAL" -ForegroundColor Magenta

$Global:Token = $null
$Global:TestResults = @()

function Test-Result {
    param([string]$Test, [bool]$Success, [string]$Details = "")
    
    $status = if ($Success) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($Success) { "Green" } else { "Red" }
    
    Write-Host "$status $Test" -ForegroundColor $color
    if ($Details) { Write-Host "   $Details" -ForegroundColor Gray }
    
    $Global:TestResults += @{ Test = $Test; Success = $Success; Details = $Details }
}

function Invoke-ApiTest {
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

# 1. Test API Health
Write-Host "`n1. TEST API HEALTH" -ForegroundColor Cyan
$health = Invoke-ApiTest -Endpoint '/health' -NoAuth
Test-Result "API Health Check" $health.Success $health.Data.status

# 2. Test Authentication
Write-Host "`n2. TEST AUTHENTIFICATION" -ForegroundColor Cyan
$loginData = @{
    email = 'demo@memolib.local'
    password = 'Demo123!'
}

$login = Invoke-ApiTest -Method 'POST' -Endpoint '/api/auth/login' -Body $loginData -NoAuth
if ($login.Success -and $login.Data.token) {
    $Global:Token = $login.Data.token
    Test-Result "Login" $true "Token obtenu"
} else {
    # Tenter création compte
    $registerData = @{
        email = 'demo@memolib.local'
        password = 'Demo123!'
        name = 'Demo User'
        role = 'AVOCAT'
        plan = 'CABINET'
    }
    
    $register = Invoke-ApiTest -Method 'POST' -Endpoint '/api/auth/register' -Body $registerData -NoAuth
    $retryLogin = Invoke-ApiTest -Method 'POST' -Endpoint '/api/auth/login' -Body $loginData -NoAuth
    
    if ($retryLogin.Success -and $retryLogin.Data.token) {
        $Global:Token = $retryLogin.Data.token
        Test-Result "Login (après création)" $true "Compte créé et connecté"
    } else {
        Test-Result "Login" $false "Impossible de se connecter"
    }
}

# 3. Test Client Management
Write-Host "`n3. TEST GESTION CLIENTS" -ForegroundColor Cyan
$clientData = @{
    name = 'Client Test'
    email = 'client.test@example.com'
    phoneNumber = '+33 6 12 34 56 78'
    address = '123 rue Test, Paris'
}

$createClient = Invoke-ApiTest -Method 'POST' -Endpoint '/api/client' -Body $clientData
Test-Result "Création client" ($createClient.Success -or $createClient.Error -like "*existe*") 

$listClients = Invoke-ApiTest -Endpoint '/api/client'
Test-Result "Liste clients" $listClients.Success "$($listClients.Data.Count) client(s)"

# 4. Test Email Ingestion
Write-Host "`n4. TEST INGESTION EMAILS" -ForegroundColor Cyan
$emailData = @{
    from = 'client.test@example.com'
    subject = 'Test Email Validation'
    body = 'Ceci est un email de test pour validation.'
    externalId = "VALIDATION-$(Get-Date -Format 'yyyyMMddHHmmss')"
    occurredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
}

$ingestEmail = Invoke-ApiTest -Method 'POST' -Endpoint '/api/ingest/email' -Body $emailData
Test-Result "Ingestion email" $ingestEmail.Success "Email traité"

# 5. Test Cases Management
Write-Host "`n5. TEST GESTION DOSSIERS" -ForegroundColor Cyan
$listCases = Invoke-ApiTest -Endpoint '/api/cases'
Test-Result "Liste dossiers" $listCases.Success "$($listCases.Data.Count) dossier(s)"

if ($listCases.Success -and $listCases.Data.Count -gt 0) {
    $firstCase = $listCases.Data[0]
    $timeline = Invoke-ApiTest -Endpoint "/api/cases/$($firstCase.id)/timeline"
    Test-Result "Timeline dossier" $timeline.Success "$($timeline.Data.Count) événement(s)"
}

# 6. Test Search
Write-Host "`n6. TEST RECHERCHE" -ForegroundColor Cyan
$searchData = @{ text = 'test' }
$search = Invoke-ApiTest -Method 'POST' -Endpoint '/api/search/events' -Body $searchData
Test-Result "Recherche textuelle" $search.Success "$($search.Data.Count) résultat(s)"

# 7. Test Dashboard
Write-Host "`n7. TEST DASHBOARD" -ForegroundColor Cyan
$overview = Invoke-ApiTest -Endpoint '/api/dashboard/overview'
if ($overview.Success) {
    $stats = $overview.Data.stats
    Test-Result "Dashboard overview" $true "Cases: $($stats.totalCases), Events: $($stats.totalEvents)"
} else {
    Test-Result "Dashboard overview" $false $overview.Error
}

# 8. Test Interfaces Web
Write-Host "`n8. TEST INTERFACES WEB" -ForegroundColor Cyan

$interfaces = @(
    @{ Name = "Interface principale"; Path = "/demo.html" },
    @{ Name = "Dashboard"; Path = "/dashboard.html" },
    @{ Name = "Export PDF"; Path = "/export.html" },
    @{ Name = "App Mobile"; Path = "/mobile.html" }
)

foreach ($interface in $interfaces) {
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl$($interface.Path)" -TimeoutSec 5 -UseBasicParsing
        Test-Result $interface.Name ($response.StatusCode -eq 200) "HTTP $($response.StatusCode)"
    } catch {
        Test-Result $interface.Name $false "Non accessible"
    }
}

# 9. Test Files
Write-Host "`n9. TEST FICHIERS STATIQUES" -ForegroundColor Cyan
$staticFiles = @(
    "/manifest.json",
    "/sw.js"
)

foreach ($file in $staticFiles) {
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl$file" -TimeoutSec 5 -UseBasicParsing
        Test-Result "Fichier $file" ($response.StatusCode -eq 200) "Disponible"
    } catch {
        Test-Result "Fichier $file" $false "Manquant"
    }
}

# 10. Test Performance
Write-Host "`n10. TEST PERFORMANCE" -ForegroundColor Cyan
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$perfTest = Invoke-ApiTest -Endpoint '/health' -NoAuth
$stopwatch.Stop()

Test-Result "Temps de réponse API" ($stopwatch.ElapsedMilliseconds -lt 1000) "$($stopwatch.ElapsedMilliseconds)ms"

# Résumé
Write-Host "`n" + "="*60 -ForegroundColor Magenta
Write-Host "📊 RÉSUMÉ DE LA VALIDATION" -ForegroundColor Magenta
Write-Host "="*60 -ForegroundColor Magenta

$totalTests = $Global:TestResults.Count
$passedTests = ($Global:TestResults | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $passedTests

Write-Host "`n✅ Tests réussis: $passedTests/$totalTests" -ForegroundColor Green
Write-Host "❌ Tests échoués: $failedTests/$totalTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`n🎉 VALIDATION COMPLÈTE RÉUSSIE!" -ForegroundColor Green
    Write-Host "MemoLib est 100% opérationnel en local" -ForegroundColor Green
} elseif ($passedTests -gt $failedTests) {
    Write-Host "`n✨ Validation majoritairement réussie" -ForegroundColor Yellow
    Write-Host "Quelques fonctionnalités nécessitent attention" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️ Validation partiellement échouée" -ForegroundColor Red
    Write-Host "Plusieurs problèmes détectés" -ForegroundColor Red
}

Write-Host "`n🌐 ACCÈS AUX INTERFACES:" -ForegroundColor Cyan
Write-Host "Interface principale: $ApiUrl/demo.html" -ForegroundColor White
Write-Host "Dashboard temps réel: $ApiUrl/dashboard.html" -ForegroundColor White
Write-Host "Export PDF: $ApiUrl/export.html" -ForegroundColor White
Write-Host "App Mobile: $ApiUrl/mobile.html" -ForegroundColor White

Write-Host "`n🔑 COMPTE DE TEST:" -ForegroundColor Cyan
Write-Host "Email: demo@memolib.local" -ForegroundColor White
Write-Host "Mot de passe: Demo123!" -ForegroundColor White

if ($failedTests -gt 0) {
    Write-Host "`n❌ TESTS ÉCHOUÉS:" -ForegroundColor Red
    $Global:TestResults | Where-Object { -not $_.Success } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Details)" -ForegroundColor Red
    }
}

Write-Host "`n🚀 MemoLib est prêt pour utilisation!" -ForegroundColor Green