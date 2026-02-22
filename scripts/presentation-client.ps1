param(
    [string]$ClientName = "Client"
)

$ErrorActionPreference = 'Stop'
$projectDir = $PSScriptRoot

Clear-Host
Write-Host ''
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host '                  PRESENTATION MEMOLIB                          ' -ForegroundColor Cyan
Write-Host '          Solution Professionnelle pour Cabinets                ' -ForegroundColor Cyan
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host "Client: $ClientName" -ForegroundColor Yellow
Write-Host "Date: $(Get-Date -Format 'dd MMMM yyyy à HH:mm')" -ForegroundColor Yellow
Write-Host ''
Write-Host 'Appuyez sur une touche pour commencer la demonstration...' -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

Clear-Host
Write-Host ''
Write-Host '================================================================' -ForegroundColor Green
Write-Host '                    ETAPE 1/4 : BUILD                           ' -ForegroundColor Green
Write-Host '================================================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Compilation du projet...' -ForegroundColor Yellow

$buildResult = dotnet build --configuration Release 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Erreur de build' -ForegroundColor Red
    exit 1
}

Write-Host '[OK] Projet compile avec succes' -ForegroundColor Green
Start-Sleep -Seconds 2

Clear-Host
Write-Host ''
Write-Host '================================================================' -ForegroundColor Green
Write-Host '                ETAPE 2/4 : DEMARRAGE API                       ' -ForegroundColor Green
Write-Host '================================================================' -ForegroundColor Green
Write-Host ''

$env:ASPNETCORE_ENVIRONMENT = 'Development'
$dbPath = Join-Path $projectDir "memolib.demo.$(Get-Date -Format 'yyyyMMdd-HHmmss').db"
$env:ConnectionStrings__Default = "Data Source=$dbPath"

Write-Host "Base de donnees: $dbPath" -ForegroundColor Cyan
Write-Host 'Demarrage du service...' -ForegroundColor Yellow

$apiProcess = Start-Process -FilePath 'dotnet' -ArgumentList 'run', '--no-build', '--configuration', 'Release' -WorkingDirectory $projectDir -PassThru -WindowStyle Hidden
Write-Host "Service demarre (PID: $($apiProcess.Id))" -ForegroundColor Green
Write-Host 'Initialisation en cours...' -ForegroundColor Yellow
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
    Start-Sleep -Seconds 2
    
    Clear-Host
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host '            ETAPE 3/4 : OUVERTURE INTERFACE WEB                 ' -ForegroundColor Green
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host ''
    
    Write-Host 'Ouverture du navigateur...' -ForegroundColor Yellow
    Start-Process 'http://localhost:8080/demo.html'
    Write-Host '[OK] Interface web ouverte' -ForegroundColor Green
    Start-Sleep -Seconds 3
    
    Clear-Host
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host '          ETAPE 4/4 : DEMONSTRATION AUTOMATIQUE                 ' -ForegroundColor Green
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host ''
    
    Write-Host 'Execution de la demonstration complete...' -ForegroundColor Yellow
    Write-Host ''
    
    $demoScript = Join-Path $projectDir 'scripts\simulate-all-advanced.ps1'
    if (Test-Path $demoScript) {
        & powershell -ExecutionPolicy Bypass -File $demoScript -BaseUrl 'http://localhost:8080' | Out-String | Write-Host
    }
    
    Clear-Host
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host '                  DEMONSTRATION TERMINEE                        ' -ForegroundColor Cyan
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'RECAPITULATIF DES FONCTIONNALITES DEMONTREES:' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  [1] SECURITE' -ForegroundColor White
    Write-Host '      - Inscription avec validation stricte' -ForegroundColor Gray
    Write-Host '      - Authentification JWT securisee' -ForegroundColor Gray
    Write-Host '      - Protection contre les attaques' -ForegroundColor Gray
    Write-Host '      - Rate limiting actif' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  [2] INGESTION & DEDUPLICATION' -ForegroundColor White
    Write-Host '      - Reception automatique des emails' -ForegroundColor Gray
    Write-Host '      - Detection et rejet des doublons' -ForegroundColor Gray
    Write-Host '      - Organisation automatique en dossiers' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  [3] RECHERCHE INTELLIGENTE' -ForegroundColor White
    Write-Host '      - Recherche textuelle instantanee' -ForegroundColor Gray
    Write-Host '      - Recherche par date' -ForegroundColor Gray
    Write-Host '      - Recherche semantique avec IA' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  [4] GESTION DE DOSSIERS' -ForegroundColor White
    Write-Host '      - Creation automatique de dossiers' -ForegroundColor Gray
    Write-Host '      - Timeline chronologique' -ForegroundColor Gray
    Write-Host '      - Attachement d events' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  [5] GESTION CLIENTS' -ForegroundColor White
    Write-Host '      - Fiches clients completes' -ForegroundColor Gray
    Write-Host '      - Historique des interactions' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  [6] STATISTIQUES & EXPORT' -ForegroundColor White
    Write-Host '      - Tableaux de bord en temps reel' -ForegroundColor Gray
    Write-Host '      - Export de donnees' -ForegroundColor Gray
    Write-Host '      - Indicateurs de performance' -ForegroundColor Gray
    Write-Host ''
    Write-Host '  [7] AUDIT & TRACABILITE' -ForegroundColor White
    Write-Host '      - Traçabilite complete des actions' -ForegroundColor Gray
    Write-Host '      - Conformite RGPD' -ForegroundColor Gray
    Write-Host '      - Audit trail immuable' -ForegroundColor Gray
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'ACCES POUR DEMONSTRATION INTERACTIVE:' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  Interface Web:  http://localhost:8080/demo.html' -ForegroundColor White
    Write-Host '  API Health:     http://localhost:8080/health' -ForegroundColor White
    Write-Host '  API Docs:       http://localhost:8080/api' -ForegroundColor White
    Write-Host ''
    Write-Host "  Base donnees:   $dbPath" -ForegroundColor White
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'POINTS FORTS DE MEMOLIB:' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  [+] Securite renforcee (JWT, validation, rate limiting)' -ForegroundColor Green
    Write-Host '  [+] Performance optimisee (recherche instantanee)' -ForegroundColor Green
    Write-Host '  [+] Intelligence artificielle (recherche semantique)' -ForegroundColor Green
    Write-Host '  [+] Organisation automatique (dossiers auto-crees)' -ForegroundColor Green
    Write-Host '  [+] Conformite RGPD (audit trail complet)' -ForegroundColor Green
    Write-Host '  [+] Interface moderne et intuitive' -ForegroundColor Green
    Write-Host '  [+] Architecture professionnelle et scalable' -ForegroundColor Green
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'PROCHAINES ETAPES:' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  1. Essai gratuit 30 jours avec vos vraies donnees' -ForegroundColor White
    Write-Host '  2. Formation personnalisee pour votre equipe (2h)' -ForegroundColor White
    Write-Host '  3. Support dedie pendant 90 jours' -ForegroundColor White
    Write-Host '  4. Garantie satisfait ou rembourse' -ForegroundColor White
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Le service reste actif pour demonstration interactive.' -ForegroundColor Cyan
    Write-Host 'Vous pouvez maintenant tester l interface web.' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Appuyez sur une touche pour arreter la demonstration...' -ForegroundColor Yellow
    
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    
    Write-Host ''
    Write-Host 'Arret du service...' -ForegroundColor Yellow
    Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host 'Service arrete' -ForegroundColor Green
    Write-Host ''
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host '              MERCI POUR VOTRE ATTENTION !                      ' -ForegroundColor Green
    Write-Host '================================================================' -ForegroundColor Green
    Write-Host ''
    Write-Host "Contact: votre-email@example.com" -ForegroundColor White
    Write-Host "Tel: +33 X XX XX XX XX" -ForegroundColor White
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
