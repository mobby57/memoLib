param(
    [string]$ClientName = "Client Demo"
)

$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '          DEMONSTRATION MEMOLIB - VERSION CLIENT           ' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host "Client: $ClientName" -ForegroundColor Yellow
Write-Host "Date: $(Get-Date -Format 'dd/MM/yyyy HH:mm')" -ForegroundColor Yellow
Write-Host ''

# 1. Demarrage API
Write-Host '[ETAPE 1/3] Demarrage du service MemoLib...' -ForegroundColor Cyan
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$dbPath = Join-Path $projectDir "memolib.demo.$(Get-Date -Format 'yyyyMMdd').db"
$env:ConnectionStrings__Default = "Data Source=$dbPath"

$apiProcess = Start-Process -FilePath 'dotnet' -ArgumentList 'run', '--no-build' -WorkingDirectory $projectDir -PassThru -WindowStyle Hidden
Write-Host "Service demarre (PID: $($apiProcess.Id))" -ForegroundColor Green
Write-Host 'Initialisation en cours...' -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    # Verification sante
    $maxRetries = 5
    $retryCount = 0
    $healthOk = $false
    
    while ($retryCount -lt $maxRetries -and -not $healthOk) {
        try {
            $health = Invoke-RestMethod -Uri 'http://localhost:8080/health' -Method GET -TimeoutSec 5
            if ($health.status -eq 'healthy') {
                $healthOk = $true
            }
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Start-Sleep -Seconds 2
            }
        }
    }
    
    if (-not $healthOk) {
        throw 'Service non disponible'
    }
    
    Write-Host 'Service operationnel!' -ForegroundColor Green
    Write-Host ''
    
    # 2. Demo interactive
    Write-Host '[ETAPE 2/3] Demonstration des fonctionnalites...' -ForegroundColor Cyan
    Write-Host ''
    
    $demoScript = Join-Path $projectDir 'scripts\simulate-all-advanced-client.ps1'
    if (Test-Path $demoScript) {
        & powershell -ExecutionPolicy Bypass -File $demoScript -BaseUrl 'http://localhost:8080'
        $demoSuccess = $LASTEXITCODE -eq 0
    } else {
        Write-Host '[WARN] Script demo introuvable, execution demo basique...' -ForegroundColor Yellow
        & powershell -ExecutionPolicy Bypass -File (Join-Path $projectDir 'scripts\simulate-all-advanced.ps1') -BaseUrl 'http://localhost:8080'
        $demoSuccess = $LASTEXITCODE -eq 0
    }
    
    Write-Host ''
    
    # 3. Informations acces
    Write-Host '[ETAPE 3/3] Informations d acces pour demonstration live...' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  URL API:        http://localhost:8080' -ForegroundColor White
    Write-Host '  Health check:   http://localhost:8080/health' -ForegroundColor White
    Write-Host '  API endpoint:   http://localhost:8080/api' -ForegroundColor White
    Write-Host ''
    Write-Host 'Endpoints disponibles:' -ForegroundColor Yellow
    Write-Host '  POST /api/auth/register    - Inscription' -ForegroundColor Gray
    Write-Host '  POST /api/auth/login       - Connexion' -ForegroundColor Gray
    Write-Host '  POST /api/ingest/email     - Reception emails' -ForegroundColor Gray
    Write-Host '  POST /api/search/events    - Recherche' -ForegroundColor Gray
    Write-Host '  GET  /api/cases            - Liste dossiers' -ForegroundColor Gray
    Write-Host '  GET  /api/client           - Liste clients' -ForegroundColor Gray
    Write-Host '  GET  /api/stats/*          - Statistiques' -ForegroundColor Gray
    Write-Host '  GET  /api/audit            - Audit trail' -ForegroundColor Gray
    Write-Host ''
    
    if ($demoSuccess) {
        Write-Host '============================================================' -ForegroundColor Green
        Write-Host '         DEMONSTRATION TERMINEE AVEC SUCCES!                ' -ForegroundColor Green
        Write-Host '============================================================' -ForegroundColor Green
    } else {
        Write-Host '============================================================' -ForegroundColor Yellow
        Write-Host '    DEMONSTRATION TERMINEE (verifier les resultats)         ' -ForegroundColor Yellow
        Write-Host '============================================================' -ForegroundColor Yellow
    }
    
    Write-Host ''
    Write-Host 'Le service reste actif pour demonstration live.' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Actions disponibles:' -ForegroundColor Yellow
    Write-Host "  [1] Tester avec Postman/Insomnia (voir fichiers .http)" -ForegroundColor White
    Write-Host "  [2] Consulter la base de donnees: $dbPath" -ForegroundColor White
    Write-Host "  [3] Relancer la demo: powershell -File .\scripts\simulate-all-advanced.ps1" -ForegroundColor White
    Write-Host ''
    Write-Host 'Pour arreter le service:' -ForegroundColor Yellow
    Write-Host "  taskkill /F /PID $($apiProcess.Id)" -ForegroundColor White
    Write-Host '  ou appuyez sur une touche...' -ForegroundColor White
    Write-Host ''
    
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    
    Write-Host ''
    Write-Host 'Arret du service...' -ForegroundColor Yellow
    Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host 'Service arrete.' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Merci pour votre attention!' -ForegroundColor Cyan
    Write-Host ''
    
} catch {
    Write-Host ''
    Write-Host 'ERREUR:' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Write-Host ''
        Write-Host 'Arret du service...' -ForegroundColor Yellow
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}
