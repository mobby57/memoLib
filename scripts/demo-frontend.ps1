param(
    [string]$ClientName = "Demo Client"
)

$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '     DEMONSTRATION COMPLETE - API + FRONTEND WEB            ' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host "Client: $ClientName" -ForegroundColor Yellow
Write-Host ''

# 1. Build
Write-Host '[1/4] Build du projet...' -ForegroundColor Cyan
$buildResult = dotnet build --configuration Debug 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Erreur de build' -ForegroundColor Red
    exit 1
}
Write-Host '[OK] Build reussi' -ForegroundColor Green
Write-Host ''

# 2. Demarrage API
Write-Host '[2/4] Demarrage de l API...' -ForegroundColor Cyan
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$dbPath = Join-Path $projectDir "memolib.demo.$(Get-Date -Format 'yyyyMMdd').db"
$env:ConnectionStrings__Default = "Data Source=$dbPath"

$apiProcess = Start-Process -FilePath 'dotnet' -ArgumentList 'run', '--no-build' -WorkingDirectory $projectDir -PassThru -WindowStyle Hidden
Write-Host "API demarree (PID: $($apiProcess.Id))" -ForegroundColor Green
Write-Host 'Initialisation...' -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    # Verification
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
        throw 'API non disponible'
    }
    
    Write-Host '[OK] API operationnelle' -ForegroundColor Green
    Write-Host ''
    
    # 3. Ouverture navigateur
    Write-Host '[3/4] Ouverture de l interface web...' -ForegroundColor Cyan
    Start-Process 'http://localhost:8080/demo.html'
    Write-Host '[OK] Navigateur ouvert' -ForegroundColor Green
    Write-Host ''
    
    # 4. Instructions
    Write-Host '[4/4] Instructions pour la demonstration' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host '  INTERFACE WEB OUVERTE : http://localhost:8080/demo.html  ' -ForegroundColor Green
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host ''
    Write-Host 'SCENARIO DE DEMONSTRATION:' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '1. Onglet AUTHENTIFICATION' -ForegroundColor White
    Write-Host '   - Inscrire un utilisateur' -ForegroundColor Gray
    Write-Host '   - Se connecter' -ForegroundColor Gray
    Write-Host ''
    Write-Host '2. Onglet INGESTION' -ForegroundColor White
    Write-Host '   - Ingerer 2-3 emails' -ForegroundColor Gray
    Write-Host ''
    Write-Host '3. Onglet RECHERCHE' -ForegroundColor White
    Write-Host '   - Recherche textuelle' -ForegroundColor Gray
    Write-Host '   - Recherche IA (impressionnant!)' -ForegroundColor Gray
    Write-Host ''
    Write-Host '4. Onglet DOSSIERS' -ForegroundColor White
    Write-Host '   - Afficher les dossiers crees' -ForegroundColor Gray
    Write-Host ''
    Write-Host '5. Onglet STATISTIQUES' -ForegroundColor White
    Write-Host '   - Tableaux de bord' -ForegroundColor Gray
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'URLS DISPONIBLES:' -ForegroundColor Yellow
    Write-Host '  Interface demo:  http://localhost:8080/demo.html' -ForegroundColor White
    Write-Host '  Page accueil:    http://localhost:8080/' -ForegroundColor White
    Write-Host '  Health check:    http://localhost:8080/health' -ForegroundColor White
    Write-Host '  API:             http://localhost:8080/api' -ForegroundColor White
    Write-Host ''
    Write-Host 'FICHIERS .HTTP POUR POSTMAN:' -ForegroundColor Yellow
    Write-Host '  test-ingest.http, test-cases.http, test-search.http' -ForegroundColor White
    Write-Host ''
    Write-Host "Base de donnees: $dbPath" -ForegroundColor Yellow
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Cyan
    Write-Host 'Appuyez sur une touche pour arreter la demonstration...' -ForegroundColor Yellow
    Write-Host '============================================================' -ForegroundColor Cyan
    
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    
    Write-Host ''
    Write-Host 'Arret de l API...' -ForegroundColor Yellow
    Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host 'API arretee' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Demonstration terminee. Merci!' -ForegroundColor Cyan
    Write-Host ''
    
} catch {
    Write-Host ''
    Write-Host 'ERREUR:' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    exit 1
}
