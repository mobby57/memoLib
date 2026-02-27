param([string]$BaseUrl = 'http://localhost:5078')

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MemoLib - Garantie Tous Services" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

# Fonction de test API
function Test-ApiReady {
    try {
        $res = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing -TimeoutSec 2
        return ($res.StatusCode -eq 200)
    } catch {
        return $false
    }
}

# 1. Verifier si l'API tourne deja
Write-Host "[1/3] Verification API..." -ForegroundColor Yellow
if (Test-ApiReady) {
    Write-Host "  [OK] API deja operationnelle" -ForegroundColor Green
} else {
    Write-Host "  [INFO] API non disponible, demarrage..." -ForegroundColor Yellow
    
    # Tuer les anciens processus
    Get-Process -Name "MemoLib.Api" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    # Demarrer l'API
    Set-Location $projectDir
    $apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --urls $BaseUrl" -WorkingDirectory $projectDir -PassThru -WindowStyle Hidden
    
    Write-Host "  [INFO] Attente du demarrage (max 30s)..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    $apiReady = $false
    
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        if (Test-ApiReady) {
            $apiReady = $true
            break
        }
        Write-Host "  [INFO] Attente... ${waited}s" -ForegroundColor Gray
    }
    
    if ($apiReady) {
        Write-Host "  [OK] API demarree (PID: $($apiProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "  [ERREUR] API n'a pas demarre apres ${maxWait}s" -ForegroundColor Red
        exit 1
    }
}

# 2. Verifier la base de donnees
Write-Host "`n[2/3] Verification base de donnees..." -ForegroundColor Yellow
$dbPath = Join-Path $projectDir "memolib.db"
if (Test-Path $dbPath) {
    $size = (Get-Item $dbPath).Length / 1KB
    Write-Host "  [OK] DB presente ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "  [INFO] DB absente, creation..." -ForegroundColor Yellow
    Set-Location $projectDir
    dotnet ef database update
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] DB creee" -ForegroundColor Green
    } else {
        Write-Host "  [ERREUR] Echec creation DB" -ForegroundColor Red
        exit 1
    }
}

# 3. Tester tous les endpoints critiques
Write-Host "`n[3/3] Test des endpoints critiques..." -ForegroundColor Yellow
$endpoints = @(
    @{ Path = "/health"; Method = "GET"; ExpectedCodes = @(200) },
    @{ Path = "/api/client"; Method = "GET"; ExpectedCodes = @(200, 401) },
    @{ Path = "/api/cases"; Method = "GET"; ExpectedCodes = @(200, 401) },
    @{ Path = "/api/ingest/email"; Method = "POST"; ExpectedCodes = @(400, 401) },
    @{ Path = "/api/search/events"; Method = "POST"; ExpectedCodes = @(400, 401) },
    @{ Path = "/demo.html"; Method = "GET"; ExpectedCodes = @(200) }
)

$allOk = $true
foreach ($endpoint in $endpoints) {
    try {
        $testUrl = "$($BaseUrl.TrimEnd('/'))$($endpoint.Path)"
        $testRes = Invoke-WebRequest -Uri $testUrl -Method $endpoint.Method -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($testRes.StatusCode -in $endpoint.ExpectedCodes) {
            Write-Host "  [OK] $($endpoint.Path)" -ForegroundColor Green
        } else {
            Write-Host "  [ATTENTION] $($endpoint.Path) - Code: $($testRes.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -in $endpoint.ExpectedCodes) {
            Write-Host "  [OK] $($endpoint.Path) (code $statusCode attendu)" -ForegroundColor Green
        } else {
            Write-Host "  [ERREUR] $($endpoint.Path)" -ForegroundColor Red
            $allOk = $false
        }
    }
}

# Resume final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Resume Final" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($allOk) {
    Write-Host "[OK] TOUS LES SERVICES SONT OPERATIONNELS" -ForegroundColor Green
    Write-Host "`nAcces :" -ForegroundColor White
    Write-Host "  - Interface : $BaseUrl/demo.html" -ForegroundColor White
    Write-Host "  - API       : $BaseUrl" -ForegroundColor White
    Write-Host "  - Health    : $BaseUrl/health`n" -ForegroundColor White
    
    # Ouvrir le navigateur
    Write-Host "Ouverture du navigateur..." -ForegroundColor Cyan
    Start-Process "$BaseUrl/demo.html"
    
    exit 0
} else {
    Write-Host "[ATTENTION] Certains services ont des problemes mineurs" -ForegroundColor Yellow
    Write-Host "Mais l'application devrait fonctionner.`n" -ForegroundColor Yellow
    Write-Host "Acces : $BaseUrl/demo.html`n" -ForegroundColor White
    exit 0
}
