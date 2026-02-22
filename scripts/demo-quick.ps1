param(
    [string]$ApiUrl = 'http://localhost:5078'
)

$ErrorActionPreference = 'Continue'

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

Write-Host "🚀 DEMONSTRATION RAPIDE MEMOLIB" -ForegroundColor Magenta

# 1. Test API
Write-Host "`n🔹 Test de l'API..." -ForegroundColor Cyan
$health = Invoke-Api -Endpoint '/health' -NoAuth
if ($health.Success) {
    Write-Host "✅ API accessible" -ForegroundColor Green
} else {
    Write-Host "❌ API inaccessible: $($health.Error)" -ForegroundColor Red
    exit 1
}

# 2. Connexion
Write-Host "`n🔹 Connexion..." -ForegroundColor Cyan
$login = Invoke-Api -Method 'POST' -Endpoint '/api/auth/login' -Body $DemoUser -NoAuth
if ($login.Success -and $login.Data.token) {
    $Global:Token = $login.Data.token
    Write-Host "✅ Connecte: $($DemoUser.Email)" -ForegroundColor Green
} else {
    Write-Host "❌ Connexion echouee" -ForegroundColor Red
    exit 1
}

# 3. Ingestion d'un email de test
Write-Host "`n🔹 Ingestion d'email de test..." -ForegroundColor Cyan
$email = @{
    from = 'client.demo@example.com'
    subject = 'Consultation juridique urgente'
    body = 'Bonjour Maitre, j''ai besoin d''une consultation urgente pour un litige commercial.'
    externalId = "DEMO-$(Get-Date -Format 'yyyyMMddHHmmss')"
    occurredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
}

$ingest = Invoke-Api -Method 'POST' -Endpoint '/api/ingest/email' -Body $email
if ($ingest.Success) {
    Write-Host "✅ Email ingere - Dossier: $($ingest.Data.caseId)" -ForegroundColor Green
} else {
    Write-Host "❌ Echec ingestion: $($ingest.Error)" -ForegroundColor Red
}

# 4. Creation d'un client
Write-Host "`n🔹 Creation d'un client..." -ForegroundColor Cyan
$client = @{
    name = 'Jean Dupont'
    email = 'jean.dupont@example.com'
    phoneNumber = '+33 6 12 34 56 78'
    address = '123 rue de la Demo, Paris'
}

$createClient = Invoke-Api -Method 'POST' -Endpoint '/api/client' -Body $client
if ($createClient.Success) {
    Write-Host "✅ Client cree: $($client.name)" -ForegroundColor Green
} else {
    Write-Host "⚠️ Client existant ou erreur: $($createClient.Error)" -ForegroundColor Yellow
}

# 5. Liste des dossiers
Write-Host "`n🔹 Consultation des dossiers..." -ForegroundColor Cyan
$cases = Invoke-Api -Endpoint '/api/cases'
if ($cases.Success) {
    $count = if ($cases.Data -is [array]) { $cases.Data.Count } else { 1 }
    Write-Host "✅ $count dossier(s) trouve(s)" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur dossiers: $($cases.Error)" -ForegroundColor Red
}

# 6. Recherche
Write-Host "`n🔹 Test de recherche..." -ForegroundColor Cyan
$search = Invoke-Api -Method 'POST' -Endpoint '/api/search/events' -Body @{ text = 'consultation' }
if ($search.Success) {
    $count = if ($search.Data -is [array]) { $search.Data.Count } else { 1 }
    Write-Host "✅ Recherche OK - $count resultat(s)" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur recherche: $($search.Error)" -ForegroundColor Red
}

# 7. Analytics
Write-Host "`n🔹 Statistiques..." -ForegroundColor Cyan
$stats = Invoke-Api -Endpoint '/api/dashboard/overview'
if ($stats.Success -and $stats.Data.stats) {
    $s = $stats.Data.stats
    Write-Host "✅ Stats - Dossiers: $($s.totalCases), Clients: $($s.totalClients), Emails: $($s.totalEvents)" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur stats: $($stats.Error)" -ForegroundColor Red
}

Write-Host "`n🎉 DEMONSTRATION TERMINEE!" -ForegroundColor Green
Write-Host "🌐 Interface: $ApiUrl/demo.html" -ForegroundColor Cyan
Write-Host "📚 Documentation: README.md" -ForegroundColor Cyan