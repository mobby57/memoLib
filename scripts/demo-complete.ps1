param(
    [string]$BaseUrl = 'http://localhost:5078',
    [string]$Email = 'sarraboudjellal57@gmail.com',
    [string]$Password = 'SecurePass123!'
)

$ErrorActionPreference = 'Stop'
$script:results = @()

function Add-TestResult($name, $status, $details) {
    $script:results += [PSCustomObject]@{
        Test = $name
        Status = $status
        Details = $details
        Time = Get-Date -Format "HH:mm:ss"
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MemoLib - Demo Complete Validee" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Authentification
Write-Host "[1/10] Test Authentification..." -ForegroundColor Yellow
try {
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
    try {
        $auth = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody -TimeoutSec 10 -ErrorAction Stop
        $token = $auth.token
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 409) {
            $registerBody = @{ email = $Email; password = $Password; name = 'Demo User'; role = 'AVOCAT'; plan = 'CABINET' } | ConvertTo-Json -Compress
            $null = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -ContentType 'application/json' -Body $registerBody -TimeoutSec 10 -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
        $auth = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody -TimeoutSec 10 -ErrorAction Stop
        $token = $auth.token
    }
    Write-Host "  [OK] Authentification reussie" -ForegroundColor Green
    Add-TestResult "Authentification" "OK" "Token obtenu"
} catch {
    Write-Host "  [ERREUR] Authentification echouee: $($_.Exception.Message)" -ForegroundColor Red
    Add-TestResult "Authentification" "ERREUR" $_.Exception.Message
    exit 1
}

# 2. Creation Client
Write-Host "[2/10] Test Creation Client..." -ForegroundColor Yellow
try {
    $clientBody = @{
        name = "Client Demo $(Get-Date -Format 'HHmmss')"
        email = "client.demo.$(Get-Date -Format 'HHmmss')@memolib.local"
        phoneNumber = "+33 6 12 34 56 78"
        address = "12 rue Demo, Paris"
    } | ConvertTo-Json
    $client = Invoke-RestMethod -Uri "$BaseUrl/api/client" -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $clientBody -TimeoutSec 10
    Write-Host "  [OK] Client cree: $($client.id)" -ForegroundColor Green
    Add-TestResult "Creation Client" "OK" "ID: $($client.id)"
    $clientId = $client.id
    $clientEmail = $client.email
} catch {
    Write-Host "  [ERREUR] Creation client echouee" -ForegroundColor Red
    Add-TestResult "Creation Client" "ERREUR" $_.Exception.Message
}

# 3. Ingestion Email
Write-Host "[3/10] Test Ingestion Email..." -ForegroundColor Yellow
try {
    $emailBody = @{
        from = $clientEmail
        subject = "Demo Email Test"
        body = "Ceci est un email de demonstration pour validation complete"
        externalId = "DEMO-$(Get-Date -Format 'yyyyMMddHHmmss')"
        occurredAt = (Get-Date).ToUniversalTime().ToString('o')
    } | ConvertTo-Json
    $ingest = Invoke-RestMethod -Uri "$BaseUrl/api/ingest/email" -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $emailBody -TimeoutSec 10
    Write-Host "  [OK] Email ingere: $($ingest.eventId)" -ForegroundColor Green
    Add-TestResult "Ingestion Email" "OK" "EventID: $($ingest.eventId)"
    $eventId = $ingest.eventId
} catch {
    Write-Host "  [ERREUR] Ingestion email echouee" -ForegroundColor Red
    Add-TestResult "Ingestion Email" "ERREUR" $_.Exception.Message
}

# 4. Recherche Events
Write-Host "[4/10] Test Recherche Events..." -ForegroundColor Yellow
try {
    $searchBody = @{ text = "demonstration" } | ConvertTo-Json
    $events = Invoke-RestMethod -Uri "$BaseUrl/api/search/events" -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $searchBody -TimeoutSec 10
    $count = if ($events -is [array]) { $events.Count } else { 1 }
    Write-Host "  [OK] Recherche: $count resultat(s)" -ForegroundColor Green
    Add-TestResult "Recherche Events" "OK" "$count resultat(s)"
} catch {
    Write-Host "  [ERREUR] Recherche echouee" -ForegroundColor Red
    Add-TestResult "Recherche Events" "ERREUR" $_.Exception.Message
}

# 5. Liste Dossiers
Write-Host "[5/10] Test Liste Dossiers..." -ForegroundColor Yellow
try {
    $cases = Invoke-RestMethod -Uri "$BaseUrl/api/cases" -Method Get -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 10
    $count = if ($cases -is [array]) { $cases.Count } else { 1 }
    Write-Host "  [OK] Dossiers: $count" -ForegroundColor Green
    Add-TestResult "Liste Dossiers" "OK" "$count dossier(s)"
} catch {
    Write-Host "  [ERREUR] Liste dossiers echouee" -ForegroundColor Red
    Add-TestResult "Liste Dossiers" "ERREUR" $_.Exception.Message
}

# 6. Liste Clients
Write-Host "[6/10] Test Liste Clients..." -ForegroundColor Yellow
try {
    $clients = Invoke-RestMethod -Uri "$BaseUrl/api/client" -Method Get -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 10
    $count = if ($clients -is [array]) { $clients.Count } else { 1 }
    Write-Host "  [OK] Clients: $count" -ForegroundColor Green
    Add-TestResult "Liste Clients" "OK" "$count client(s)"
} catch {
    Write-Host "  [ERREUR] Liste clients echouee" -ForegroundColor Red
    Add-TestResult "Liste Clients" "ERREUR" $_.Exception.Message
}

# 7. Statistiques
Write-Host "[7/10] Test Statistiques..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$BaseUrl/api/stats/events-per-day" -Method Get -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 10
    $count = if ($stats -is [array]) { $stats.Count } else { 1 }
    Write-Host "  [OK] Stats: $count jour(s)" -ForegroundColor Green
    Add-TestResult "Statistiques" "OK" "$count jour(s) d'activite"
} catch {
    Write-Host "  [ERREUR] Statistiques echouees" -ForegroundColor Red
    Add-TestResult "Statistiques" "ERREUR" $_.Exception.Message
}

# 8. Audit
Write-Host "[8/10] Test Audit..." -ForegroundColor Yellow
try {
    $audit = Invoke-RestMethod -Uri "$BaseUrl/api/audit/user-actions?limit=10" -Method Get -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 10
    $count = if ($audit -is [array]) { $audit.Count } else { 1 }
    Write-Host "  [OK] Audit: $count action(s)" -ForegroundColor Green
    Add-TestResult "Audit" "OK" "$count action(s) loguee(s)"
} catch {
    Write-Host "  [ERREUR] Audit echoue" -ForegroundColor Red
    Add-TestResult "Audit" "ERREUR" $_.Exception.Message
}

# 9. Alertes
Write-Host "[9/10] Test Alertes..." -ForegroundColor Yellow
try {
    $alerts = Invoke-RestMethod -Uri "$BaseUrl/api/alerts/requires-attention" -Method Get -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 10
    $count = $alerts.count
    Write-Host "  [OK] Alertes: $count" -ForegroundColor Green
    Add-TestResult "Alertes" "OK" "$count alerte(s)"
} catch {
    Write-Host "  [ERREUR] Alertes echouees" -ForegroundColor Red
    Add-TestResult "Alertes" "ERREUR" $_.Exception.Message
}

# 10. Dashboard
Write-Host "[10/10] Test Dashboard..." -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$BaseUrl/api/dashboard/overview" -Method Get -Headers @{ Authorization = "Bearer $token" } -TimeoutSec 10
    Write-Host "  [OK] Dashboard: $($dashboard.stats.totalCases) dossiers, $($dashboard.stats.totalClients) clients" -ForegroundColor Green
    Add-TestResult "Dashboard" "OK" "$($dashboard.stats.totalCases) dossiers, $($dashboard.stats.totalClients) clients"
} catch {
    Write-Host "  [ERREUR] Dashboard echoue" -ForegroundColor Red
    Add-TestResult "Dashboard" "ERREUR" $_.Exception.Message
}

# Resume
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Resume de la Demo Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$script:results | Format-Table -AutoSize

$okCount = ($script:results | Where-Object { $_.Status -eq "OK" }).Count
$totalCount = $script:results.Count
$percentage = [math]::Round(($okCount / $totalCount) * 100, 0)

$color = if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" }
Write-Host "`nResultat: $okCount / $totalCount tests reussis ($percentage%)" -ForegroundColor $color

if ($percentage -eq 100) {
    Write-Host "`n[OK] DEMO COMPLETE VALIDEE - Tous les tests passes !`n" -ForegroundColor Green
    exit 0
} elseif ($percentage -ge 80) {
    Write-Host "`n[ATTENTION] Demo majoritairement validee avec quelques erreurs`n" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n[ERREUR] Demo echouee - Plusieurs tests en erreur`n" -ForegroundColor Red
    exit 1
}
