param([string]$BaseUrl = 'http://localhost:5078')

$ErrorActionPreference = 'Continue'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MemoLib - Diagnostic Complet" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allChecks = @()

# 1. API Health
Write-Host "[1/8] API Health Check..." -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing -TimeoutSec 3
    if ($res.StatusCode -eq 200) {
        Write-Host "  [OK] API operationnelle" -ForegroundColor Green
        $allChecks += $true
    }
} catch {
    Write-Host "  [ERREUR] API non disponible" -ForegroundColor Red
    $allChecks += $false
}

# 2. Base de donnees
Write-Host "[2/8] Base de donnees..." -ForegroundColor Yellow
$dbPath = Join-Path (Split-Path -Parent $PSScriptRoot) "memolib.db"
if (Test-Path $dbPath) {
    $size = (Get-Item $dbPath).Length / 1KB
    Write-Host "  [OK] DB presente ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "  [ERREUR] DB absente" -ForegroundColor Red
    $allChecks += $false
}

# 3. Authentification
Write-Host "[3/8] Endpoint Auth..." -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" -Method Post -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "  [OK] /api/auth/login accessible" -ForegroundColor Green
    $allChecks += $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "  [OK] /api/auth/login accessible (400 attendu)" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  [ERREUR] /api/auth/login inaccessible" -ForegroundColor Red
        $allChecks += $false
    }
}

# 4. Clients
Write-Host "[4/8] Endpoint Clients..." -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/api/client" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "  [OK] /api/client accessible" -ForegroundColor Green
    $allChecks += $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "  [OK] /api/client accessible (auth requise)" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  [ERREUR] /api/client inaccessible" -ForegroundColor Red
        $allChecks += $false
    }
}

# 5. Dossiers
Write-Host "[5/8] Endpoint Dossiers..." -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/api/cases" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "  [OK] /api/cases accessible" -ForegroundColor Green
    $allChecks += $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "  [OK] /api/cases accessible (auth requise)" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  [ERREUR] /api/cases inaccessible" -ForegroundColor Red
        $allChecks += $false
    }
}

# 6. Ingestion
Write-Host "[6/8] Endpoint Ingestion..." -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/api/ingest/email" -Method Post -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "  [OK] /api/ingest/email accessible" -ForegroundColor Green
    $allChecks += $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -in @(400, 401)) {
        Write-Host "  [OK] /api/ingest/email accessible" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  [ERREUR] /api/ingest/email inaccessible" -ForegroundColor Red
        $allChecks += $false
    }
}

# 7. Recherche
Write-Host "[7/8] Endpoint Recherche..." -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/api/search/events" -Method Post -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "  [OK] /api/search/events accessible" -ForegroundColor Green
    $allChecks += $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -in @(400, 401)) {
        Write-Host "  [OK] /api/search/events accessible" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "  [ERREUR] /api/search/events inaccessible" -ForegroundColor Red
        $allChecks += $false
    }
}

# 8. Interface Web
Write-Host "[8/8] Interface Web..." -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "$BaseUrl/demo.html" -UseBasicParsing -TimeoutSec 3
    if ($res.StatusCode -eq 200) {
        Write-Host "  [OK] Interface accessible" -ForegroundColor Green
        $allChecks += $true
    }
} catch {
    Write-Host "  [ERREUR] Interface inaccessible" -ForegroundColor Red
    $allChecks += $false
}

# Resume
$passed = ($allChecks | Where-Object { $_ -eq $true }).Count
$total = $allChecks.Count
$percentage = [math]::Round(($passed / $total) * 100, 0)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Resume du Diagnostic" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Tests reussis : $passed / $total ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { 'Green' } elseif ($percentage -ge 75) { 'Yellow' } else { 'Red' })

if ($percentage -eq 100) {
    Write-Host "`n[OK] Tous les services sont operationnels !`n" -ForegroundColor Green
    Write-Host "Acces :" -ForegroundColor White
    Write-Host "  - API      : $BaseUrl" -ForegroundColor White
    Write-Host "  - Interface: $BaseUrl/demo.html" -ForegroundColor White
    Write-Host "  - Health   : $BaseUrl/health`n" -ForegroundColor White
    exit 0
} elseif ($percentage -ge 75) {
    Write-Host "`n[ATTENTION] La plupart des services fonctionnent`n" -ForegroundColor Yellow
    Write-Host "Lancez : .\scripts\ensure-all-services.ps1`n" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n[ERREUR] Plusieurs services ont des problemes`n" -ForegroundColor Red
    Write-Host "Solutions :" -ForegroundColor Yellow
    Write-Host "  1. Lancez : .\scripts\start-all.ps1" -ForegroundColor White
    Write-Host "  2. Ou manuellement : dotnet run --urls $BaseUrl`n" -ForegroundColor White
    exit 1
}
