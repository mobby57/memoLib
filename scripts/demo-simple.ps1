param([string]$ApiUrl = 'http://localhost:5078')

$DemoUser = @{
    Email = 'sarraboudjellal57@gmail.com'
    Password = 'SecurePass123!'
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
Write-Host "Test API..." -ForegroundColor Cyan
$health = Invoke-Api -Endpoint '/health' -NoAuth
if ($health.Success) {
    Write-Host "OK - API accessible" -ForegroundColor Green
} else {
    Write-Host "ERREUR - API inaccessible" -ForegroundColor Red
    exit 1
}

# 2. Connexion
Write-Host "Connexion..." -ForegroundColor Cyan
$login = Invoke-Api -Method 'POST' -Endpoint '/api/auth/login' -Body $DemoUser -NoAuth
if ($login.Success -and $login.Data.token) {
    $Global:Token = $login.Data.token
    Write-Host "OK - Connecte" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Connexion echouee" -ForegroundColor Red
    exit 1
}

# 3. Ingestion email
Write-Host "Ingestion email..." -ForegroundColor Cyan
$email = @{
    from = 'client.demo@example.com'
    subject = 'Consultation juridique urgente'
    body = 'Bonjour, besoin consultation urgente.'
    externalId = "DEMO-$(Get-Date -Format 'yyyyMMddHHmmss')"
    occurredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
}

$ingest = Invoke-Api -Method 'POST' -Endpoint '/api/ingest/email' -Body $email
if ($ingest.Success) {
    Write-Host "OK - Email ingere" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Ingestion echouee" -ForegroundColor Red
}

# 4. Creation client
Write-Host "Creation client..." -ForegroundColor Cyan
$client = @{
    name = 'Jean Dupont'
    email = 'jean.dupont@example.com'
    phoneNumber = '+33 6 12 34 56 78'
    address = '123 rue Demo, Paris'
}

$createClient = Invoke-Api -Method 'POST' -Endpoint '/api/client' -Body $client
if ($createClient.Success) {
    Write-Host "OK - Client cree" -ForegroundColor Green
} else {
    Write-Host "INFO - Client existant" -ForegroundColor Yellow
}

# 5. Liste dossiers
Write-Host "Liste dossiers..." -ForegroundColor Cyan
$cases = Invoke-Api -Endpoint '/api/cases'
if ($cases.Success) {
    $count = if ($cases.Data -is [array]) { $cases.Data.Count } else { 1 }
    Write-Host "OK - $count dossiers" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Dossiers" -ForegroundColor Red
}

# 6. Recherche
Write-Host "Test recherche..." -ForegroundColor Cyan
$search = Invoke-Api -Method 'POST' -Endpoint '/api/search/events' -Body @{ text = 'consultation' }
if ($search.Success) {
    $count = if ($search.Data -is [array]) { $search.Data.Count } else { 1 }
    Write-Host "OK - Recherche $count resultats" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Recherche" -ForegroundColor Red
}

# 7. Analytics
Write-Host "Analytics..." -ForegroundColor Cyan
$stats = Invoke-Api -Endpoint '/api/dashboard/overview'
if ($stats.Success -and $stats.Data.stats) {
    $s = $stats.Data.stats
    Write-Host "OK - Stats: $($s.totalCases) dossiers, $($s.totalClients) clients" -ForegroundColor Green
} else {
    Write-Host "ERREUR - Analytics" -ForegroundColor Red
}

Write-Host "DEMONSTRATION TERMINEE!" -ForegroundColor Green
Write-Host "Interface: $ApiUrl/demo.html" -ForegroundColor Cyan