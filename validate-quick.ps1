# Validation Rapide - MemoLib API
# Ce script verifie que tous les composants critiques sont en place

Write-Host "Verification MemoLib API" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray
Write-Host ""

$errors = @()
$warnings = @()
$success = @()

# 1. Verifier .NET SDK
Write-Host "Verification .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version
    if ($dotnetVersion -match "^9\.") {
        $success += ".NET SDK 9.0 installe ($dotnetVersion)"
    } else {
        $warnings += ".NET SDK version $dotnetVersion (9.0 recommande)"
    }
} catch {
    $errors += ".NET SDK non installe"
}

# 2. Verifier fichiers critiques
Write-Host "Verification fichiers critiques..." -ForegroundColor Yellow
$criticalFiles = @(
    "Program.cs",
    "MemoLib.Api.csproj",
    "appsettings.json",
    "Data\MemoLibDbContext.cs",
    "wwwroot\demo.html"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $success += "$file existe"
    } else {
        $errors += "$file manquant"
    }
}

# 3. Verifier base de donnees
Write-Host "Verification base de donnees..." -ForegroundColor Yellow
if (Test-Path "memolib.db") {
    $dbSize = (Get-Item "memolib.db").Length / 1KB
    $success += "Base de donnees existe ($([math]::Round($dbSize, 2)) KB)"
} else {
    $warnings += "Base de donnees non creee (sera creee au demarrage)"
}

# 4. Verifier dossier Migrations
Write-Host "Verification migrations..." -ForegroundColor Yellow
if (Test-Path "Migrations") {
    $migrationCount = (Get-ChildItem "Migrations" -Filter "*.cs" | Where-Object { $_.Name -notlike "*Designer.cs" -and $_.Name -ne "MemoLibDbContextModelSnapshot.cs" }).Count
    $success += "$migrationCount migrations trouvees"
} else {
    $errors += "Dossier Migrations manquant"
}

# 5. Verifier Controllers
Write-Host "Verification controllers..." -ForegroundColor Yellow
if (Test-Path "Controllers") {
    $controllerCount = (Get-ChildItem "Controllers" -Filter "*Controller.cs").Count
    $success += "$controllerCount controllers trouves"
} else {
    $errors += "Dossier Controllers manquant"
}

# 6. Verifier Services
Write-Host "Verification services..." -ForegroundColor Yellow
if (Test-Path "Services") {
    $serviceCount = (Get-ChildItem "Services" -Filter "*.cs").Count
    $success += "$serviceCount services trouves"
} else {
    $errors += "Dossier Services manquant"
}

# 7. Verifier Models
Write-Host "Verification models..." -ForegroundColor Yellow
if (Test-Path "Models") {
    $modelCount = (Get-ChildItem "Models" -Filter "*.cs").Count
    $success += "$modelCount models trouves"
} else {
    $errors += "Dossier Models manquant"
}

# 8. Verifier configuration JWT
Write-Host "Verification configuration JWT..." -ForegroundColor Yellow
$appsettings = Get-Content "appsettings.json" -Raw | ConvertFrom-Json
if ($appsettings.JwtSettings.SecretKey -and $appsettings.JwtSettings.SecretKey.Length -ge 32) {
    $success += "JWT SecretKey configuree"
} else {
    $errors += "JWT SecretKey invalide ou manquante"
}

# 9. Verifier configuration Email
Write-Host "Verification configuration Email..." -ForegroundColor Yellow
if ($appsettings.EmailMonitor.Username) {
    $success += "Email Monitor configure ($($appsettings.EmailMonitor.Username))"
    if (-not $appsettings.EmailMonitor.Password) {
        $warnings += "Email Monitor Password vide (utiliser user-secrets)"
    }
} else {
    $warnings += "Email Monitor non configure"
}

# 10. Verifier dossier wwwroot
Write-Host "Verification interface web..." -ForegroundColor Yellow
if (Test-Path "wwwroot") {
    $htmlCount = (Get-ChildItem "wwwroot" -Filter "*.html").Count
    $success += "$htmlCount pages HTML trouvees"
} else {
    $errors += "Dossier wwwroot manquant"
}

# Afficher les resultats
Write-Host ""
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "RESULTATS DE LA VALIDATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "SUCCES ($($success.Count)):" -ForegroundColor Green
    foreach ($item in $success) {
        Write-Host "  + $item" -ForegroundColor Green
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "AVERTISSEMENTS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "  ! $item" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "ERREURS ($($errors.Count)):" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "  x $item" -ForegroundColor Red
    }
    Write-Host ""
}

# Score final
$totalChecks = $success.Count + $warnings.Count + $errors.Count
$score = [math]::Round(($success.Count / $totalChecks) * 100, 0)

Write-Host "============================================================" -ForegroundColor Gray
Write-Host "SCORE FINAL: $score%" -ForegroundColor $(if ($score -ge 90) { "Green" } elseif ($score -ge 70) { "Yellow" } else { "Red" })
Write-Host "============================================================" -ForegroundColor Gray
Write-Host ""

if ($errors.Count -eq 0) {
    Write-Host "PROJET VALIDE - Pret a demarrer!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour demarrer l'application:" -ForegroundColor Cyan
    Write-Host "  dotnet run" -ForegroundColor White
    Write-Host ""
    Write-Host "Puis ouvrir dans le navigateur:" -ForegroundColor Cyan
    Write-Host "  http://localhost:5078/demo.html" -ForegroundColor White
} else {
    Write-Host "ATTENTION - Corriger les erreurs avant de demarrer" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Consulter la documentation:" -ForegroundColor Cyan
    Write-Host "  README.md" -ForegroundColor White
    Write-Host "  QUICK_START.md" -ForegroundColor White
}

Write-Host ""
Write-Host "Rapport complet: PROJECT_STATUS_REPORT.md" -ForegroundColor Cyan
Write-Host ""
