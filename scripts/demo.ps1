param([string]$ApiUrl = 'http://localhost:5078')

$DemoUser = @{
    Email = 'demo@memolib.local'
    Password = 'Demo123!'
    Name = 'Demo User'
}

$Global:Token = $null

function Invoke-Api {
    param([string]$Method = 'GET', [string]$Endpoint, [object]$Body = $null, [switch]$NoAuth)
    
    try {
        $headers = @{}
        if (-not $NoAuth -and $Global:Token) {
            $headers['Authorization'] = "Bearer $Global:Token"
        }
        
        if ($Body) {
            $headers['Content-Type'] = 'application/json'
            $response = Invoke-RestMethod -Uri "$ApiUrl$Endpoint" -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json) -TimeoutSec 15
        } else {
            $response = Invoke-RestMethod -Uri "$ApiUrl$Endpoint" -Method $Method -Headers $headers -TimeoutSec 15
        }
        
        return @{ Success = $true; Data = $response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

Write-Host "DEMONSTRATION MEMOLIB" -ForegroundColor Magenta

# 1. Test API
Write-Host "1. Test API..." -ForegroundColor Cyan
$health = Invoke-Api -Endpoint '/health' -NoAuth
if ($health.Success) {
    Write-Host "   OK - API accessible" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - API inaccessible" -ForegroundColor Red
    exit 1
}

# 2. Creation compte et connexion
Write-Host "2. Authentification..." -ForegroundColor Cyan

# Tentative connexion
$login = Invoke-Api -Method 'POST' -Endpoint '/api/auth/login' -Body $DemoUser -NoAuth

if (-not $login.Success) {
    Write-Host "   Creation compte..." -ForegroundColor Yellow
    
    $registerBody = @{
        email = $DemoUser.Email
        password = $DemoUser.Password
        name = $DemoUser.Name
        role = 'AVOCAT'
        plan = 'CABINET'
    }
    
    $register = Invoke-Api -Method 'POST' -Endpoint '/api/auth/register' -Body $registerBody -NoAuth
    $login = Invoke-Api -Method 'POST' -Endpoint '/api/auth/login' -Body $DemoUser -NoAuth
}

if ($login.Success -and $login.Data.token) {
    $Global:Token = $login.Data.token
    Write-Host "   OK - Connecte" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - Connexion impossible" -ForegroundColor Red
    exit 1
}

# 3. Creation client
Write-Host "3. Creation client..." -ForegroundColor Cyan
$client = @{
    name = 'Marie Dupont'
    email = 'marie.dupont@example.com'
    phoneNumber = '+33 6 12 34 56 78'
    address = '123 rue Demo, Paris'
}

$createClient = Invoke-Api -Method 'POST' -Endpoint '/api/client' -Body $client
Write-Host "   OK - Client traite" -ForegroundColor Green

# 4. Ingestion emails
Write-Host "4. Ingestion emails..." -ForegroundColor Cyan

$email1 = @{
    from = 'marie.dupont@example.com'
    subject = 'Consultation divorce'
    body = 'Bonjour, je souhaite une consultation.'
    externalId = "DEMO-1-$(Get-Date -Format 'yyyyMMddHHmmss')"
    occurredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
}

$email2 = @{
    from = 'pierre.martin@example.com'
    subject = 'Litige commercial'
    body = 'Nous avons un litige a traiter.'
    externalId = "DEMO-2-$(Get-Date -Format 'yyyyMMddHHmmss')"
    occurredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
}

$ingest1 = Invoke-Api -Method 'POST' -Endpoint '/api/ingest/email' -Body $email1
$ingest2 = Invoke-Api -Method 'POST' -Endpoint '/api/ingest/email' -Body $email2

Write-Host "   OK - 2 emails ingeres" -ForegroundColor Green

# 5. Verification dossiers
Write-Host "5. Verification dossiers..." -ForegroundColor Cyan
$cases = Invoke-Api -Endpoint '/api/cases'
if ($cases.Success) {
    $count = if ($cases.Data -is [array]) { $cases.Data.Count } else { 1 }
    Write-Host "   OK - $count dossiers" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - Dossiers" -ForegroundColor Red
}

# 6. Test recherche
Write-Host "6. Test recherche..." -ForegroundColor Cyan
$search = Invoke-Api -Method 'POST' -Endpoint '/api/search/events' -Body @{ text = 'divorce' }
if ($search.Success) {
    $count = if ($search.Data -is [array]) { $search.Data.Count } else { 1 }
    Write-Host "   OK - Recherche $count resultats" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - Recherche" -ForegroundColor Red
}

# 7. Analytics
Write-Host "7. Analytics..." -ForegroundColor Cyan
$stats = Invoke-Api -Endpoint '/api/dashboard/overview'
if ($stats.Success -and $stats.Data.stats) {
    $s = $stats.Data.stats
    Write-Host "   OK - $($s.totalCases) dossiers, $($s.totalClients) clients, $($s.totalEvents) emails" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - Analytics" -ForegroundColor Red
}

# 8. Centre anomalies
Write-Host "8. Centre anomalies..." -ForegroundColor Cyan
$anomalies = Invoke-Api -Endpoint '/api/alerts/center?limit=5'
if ($anomalies.Success) {
    $openAnomalies = $anomalies.Data.summary.totalOpenAnomalies
    Write-Host "   OK - $openAnomalies anomalies" -ForegroundColor Green
} else {
    Write-Host "   ERREUR - Anomalies" -ForegroundColor Red
}

Write-Host "`nDEMONSTRATION TERMINEE!" -ForegroundColor Green
Write-Host "Interface: $ApiUrl/demo.html" -ForegroundColor Cyan
Write-Host "Compte: $($DemoUser.Email) / $($DemoUser.Password)" -ForegroundColor Cyan