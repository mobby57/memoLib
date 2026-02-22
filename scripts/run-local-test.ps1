param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot

Write-Host '=========================================================' -ForegroundColor Cyan
Write-Host 'MemoLib - Test complet en local' -ForegroundColor Cyan
Write-Host '=========================================================' -ForegroundColor Cyan
Write-Host ''

# 1. Build
if (-not $SkipBuild) {
    Write-Host '[1/5] Build du projet...' -ForegroundColor Yellow
    $buildResult = dotnet build --configuration Debug 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Erreur de build' -ForegroundColor Red
        Write-Host $buildResult
        exit 1
    }
    Write-Host '[OK] Build reussi' -ForegroundColor Green
    Write-Host ''
} else {
    Write-Host '[1/5] Build ignore (SkipBuild)' -ForegroundColor Yellow
    Write-Host ''
}

# 2. Nettoyage base de donnees
Write-Host '[2/5] Nettoyage base de donnees...' -ForegroundColor Yellow
$dbPath = Join-Path $projectDir 'memolib.test.db'
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
    Write-Host '[OK] Base de donnees nettoyee' -ForegroundColor Green
} else {
    Write-Host '[OK] Pas de base existante' -ForegroundColor Green
}
Write-Host ''

# 3. Demarrage API
Write-Host '[3/5] Demarrage de l API...' -ForegroundColor Yellow
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ConnectionStrings__Default = "Data Source=$dbPath"

$apiProcess = Start-Process -FilePath 'dotnet' -ArgumentList 'run', '--no-build' -WorkingDirectory $projectDir -PassThru -WindowStyle Hidden

Write-Host "API demarree (PID: $($apiProcess.Id))" -ForegroundColor Green
Write-Host 'Attente initialisation (10s)...' -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    # 4. Test health
    Write-Host ''
    Write-Host '[4/5] Verification sante API...' -ForegroundColor Yellow
    $maxRetries = 5
    $retryCount = 0
    $healthOk = $false
    
    while ($retryCount -lt $maxRetries -and -not $healthOk) {
        try {
            $health = Invoke-RestMethod -Uri 'http://localhost:8080/health' -Method GET -TimeoutSec 5
            if ($health.status -eq 'healthy') {
                $healthOk = $true
                Write-Host '[OK] API operationnelle' -ForegroundColor Green
            }
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Host "Tentative $retryCount/$maxRetries..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
    }
    
    if (-not $healthOk) {
        throw 'API non disponible apres plusieurs tentatives'
    }
    
    Write-Host ''
    
    # 5. Tests ameliorations
    Write-Host '[5/5] Test des ameliorations...' -ForegroundColor Yellow
    Write-Host ''
    
    $testScript = Join-Path $projectDir 'scripts\test-improvements.ps1'
    if (Test-Path $testScript) {
        & powershell -ExecutionPolicy Bypass -File $testScript -BaseUrl 'http://localhost:8080'
    } else {
        Write-Host '[WARN] Script test-improvements.ps1 introuvable' -ForegroundColor Yellow
    }
    
    Write-Host ''
    Write-Host '=========================================================' -ForegroundColor Cyan
    Write-Host 'Test complet termine avec succes!' -ForegroundColor Green
    Write-Host '=========================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'API toujours en cours d execution (PID: '$apiProcess.Id')' -ForegroundColor Yellow
    Write-Host 'Pour executer la demo avancee:' -ForegroundColor Yellow
    Write-Host '  powershell -ExecutionPolicy Bypass -File .\scripts\simulate-all-advanced.ps1' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Pour arreter l API:' -ForegroundColor Yellow
    Write-Host "  Stop-Process -Id $($apiProcess.Id)" -ForegroundColor Cyan
    Write-Host ''
    
} catch {
    Write-Host ''
    Write-Host 'Erreur durant les tests:' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Write-Host ''
        Write-Host 'Arret de l API...' -ForegroundColor Yellow
        Stop-Process -Id $apiProcess.Id -Force
        Write-Host 'API arretee' -ForegroundColor Green
    }
    
    exit 1
}
