param(
    [string]$BaseUrl = 'http://localhost:5078'
)

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

Write-Host "`n=== Vérification de tous les services ===" -ForegroundColor Cyan

# 1. Vérifier l'API
Write-Host "`n[1/3] Vérification API..." -ForegroundColor Yellow
try {
    $healthUrl = "$($BaseUrl.TrimEnd('/'))/health"
    $res = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 3
    if ($res.StatusCode -eq 200) {
        Write-Host "✅ API opérationnelle sur $BaseUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ API non disponible. Démarrage..." -ForegroundColor Red
    
    Set-Location $projectDir
    
    # Tuer les processus existants
    Get-Process -Name "MemoLib.Api" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    # Démarrer l'API
    $apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --urls $BaseUrl" -WorkingDirectory $projectDir -PassThru -WindowStyle Hidden
    
    Write-Host "⏳ Attente du démarrage de l'API..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    $apiReady = $false
    
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        try {
            $testRes = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
            if ($testRes.StatusCode -eq 200) {
                $apiReady = $true
                break
            }
        } catch {}
    }
    
    if ($apiReady) {
        Write-Host "✅ API démarrée avec succès (PID: $($apiProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "❌ Échec du démarrage de l'API après ${maxWait}s" -ForegroundColor Red
        exit 1
    }
}

# 2. Vérifier la base de données
Write-Host "`n[2/3] Vérification base de données..." -ForegroundColor Yellow
$dbPath = Join-Path $projectDir "memolib.db"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length / 1KB
    Write-Host "✅ Base de données présente ($([math]::Round($dbSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Base de données absente. Création..." -ForegroundColor Yellow
    Set-Location $projectDir
    dotnet ef database update
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de données créée" -ForegroundColor Green
    } else {
        Write-Host "❌ Échec création base de données" -ForegroundColor Red
        exit 1
    }
}

# 3. Vérifier les endpoints critiques
Write-Host "`n[3/3] Vérification endpoints critiques..." -ForegroundColor Yellow
$endpoints = @(
    "/api/auth/login",
    "/api/client",
    "/api/cases",
    "/api/ingest/email",
    "/api/search/events"
)

$allOk = $true
foreach ($endpoint in $endpoints) {
    try {
        $testUrl = "$($BaseUrl.TrimEnd('/'))$endpoint"
        $testRes = Invoke-WebRequest -Uri $testUrl -Method Get -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        # 401 est OK (non authentifié), 200 est OK
        if ($testRes.StatusCode -in @(200, 401)) {
            Write-Host "  ✅ $endpoint" -ForegroundColor Green
        }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "  ✅ $endpoint (auth requise)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $endpoint" -ForegroundColor Red
            $allOk = $false
        }
    }
}

# Résumé final
Write-Host "`n=== Résumé ===" -ForegroundColor Cyan
if ($allOk) {
    Write-Host "✅ Tous les services sont opérationnels" -ForegroundColor Green
    Write-Host "`nAccès:" -ForegroundColor White
    Write-Host "  - API: $BaseUrl" -ForegroundColor White
    Write-Host "  - Interface: $BaseUrl/demo.html" -ForegroundColor White
    Write-Host "  - Health: $BaseUrl/health" -ForegroundColor White
    exit 0
} else {
    Write-Host "⚠️  Certains services ont des problèmes" -ForegroundColor Yellow
    exit 1
}
