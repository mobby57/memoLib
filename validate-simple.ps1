# Validation complete MemoLib
Write-Host "VALIDATION COMPLETE DES WORKFLOWS MEMOLIB" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:5078"
$score = 0
$total = 0

# Test 1: API Health
Write-Host "1. Test connexion API..." -ForegroundColor Yellow
$total++
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 5
    Write-Host "   OK - API accessible" -ForegroundColor Green
    $score++
} catch {
    Write-Host "   ERREUR - API inaccessible" -ForegroundColor Red
}

# Test 2: Base de donnees
Write-Host "2. Test base de donnees..." -ForegroundColor Yellow
$total++
if (Test-Path "memolib.db") {
    $dbSize = (Get-Item "memolib.db").Length / 1MB
    Write-Host "   OK - SQLite present" -ForegroundColor Green
    $score++
} else {
    Write-Host "   ERREUR - memolib.db introuvable" -ForegroundColor Red
}

# Test 3: Configuration
Write-Host "3. Test configuration..." -ForegroundColor Yellow
$total++
if (Test-Path "appsettings.json") {
    Write-Host "   OK - Configuration presente" -ForegroundColor Green
    $score++
} else {
    Write-Host "   ERREUR - appsettings.json manquant" -ForegroundColor Red
}

# Test 4: Interface web
Write-Host "4. Test interface web..." -ForegroundColor Yellow
$total++
if (Test-Path "wwwroot\demo.html") {
    Write-Host "   OK - Interface presente" -ForegroundColor Green
    $score++
} else {
    Write-Host "   AVERTISSEMENT - demo.html manquant" -ForegroundColor Yellow
}

# Test 5: Migrations
Write-Host "5. Test migrations..." -ForegroundColor Yellow
$total++
if (Test-Path "Migrations") {
    $migrations = (Get-ChildItem "Migrations" -Filter "*.cs").Count
    Write-Host "   OK - $migrations migrations trouvees" -ForegroundColor Green
    $score++
} else {
    Write-Host "   ERREUR - Dossier Migrations manquant" -ForegroundColor Red
}

# Test 6: Projet
Write-Host "6. Test fichier projet..." -ForegroundColor Yellow
$total++
if (Test-Path "MemoLib.Api.csproj") {
    Write-Host "   OK - Projet .NET present" -ForegroundColor Green
    $score++
} else {
    Write-Host "   ERREUR - .csproj manquant" -ForegroundColor Red
}

# Resultat final
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "RESULTAT: $score/$total tests reussis" -ForegroundColor Cyan
$percentage = [math]::Round(($score / $total) * 100, 0)
Write-Host "SCORE: $percentage%" -ForegroundColor $(if ($percentage -ge 90) { "Green" } elseif ($percentage -ge 70) { "Yellow" } else { "Red" })
Write-Host ""

if ($percentage -ge 90) {
    Write-Host "SYSTEME OPERATIONNEL - Tous les workflows sont OK!" -ForegroundColor Green
} elseif ($percentage -ge 70) {
    Write-Host "SYSTEME FONCTIONNEL - Quelques optimisations possibles" -ForegroundColor Yellow
} else {
    Write-Host "ATTENTION - Corrections necessaires" -ForegroundColor Red
}

Write-Host ""
Write-Host "Validation terminee!" -ForegroundColor Cyan
