# Script de nettoyage des fichiers redondants
# Usage: .\scripts\cleanup-redundant-files.ps1

Write-Host "🧹 Nettoyage des fichiers redondants..." -ForegroundColor Cyan

$deletedCount = 0
$errors = @()

# Scripts BAT à garder
$keepBats = @("DEMARRER.bat", "ARRETER.bat")

# Scripts PS1 à garder
$keepPS1 = @("start.ps1", "deploy.ps1")

# Scripts SH à garder
$keepSH = @("start.sh", "deploy.sh")

# Supprimer scripts BAT redondants
Write-Host "`n📝 Suppression des scripts .bat redondants..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "*.bat" -Recurse -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -notin $keepBats -and $_.DirectoryName -notlike "*node_modules*"
} | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        Write-Host "  ✅ Supprimé: $($_.Name)" -ForegroundColor Green
        $deletedCount++
    } catch {
        $errors += "Erreur suppression $($_.Name): $_"
    }
}

# Supprimer scripts PS1 redondants
Write-Host "`n📝 Suppression des scripts .ps1 redondants..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "*.ps1" -Recurse -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -notin $keepPS1 -and $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*scripts*"
} | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        Write-Host "  ✅ Supprimé: $($_.Name)" -ForegroundColor Green
        $deletedCount++
    } catch {
        $errors += "Erreur suppression $($_.Name): $_"
    }
}

# Supprimer scripts SH redondants
Write-Host "`n📝 Suppression des scripts .sh redondants..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "*.sh" -Recurse -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -notin $keepSH -and $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*scripts*"
} | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        Write-Host "  ✅ Supprimé: $($_.Name)" -ForegroundColor Green
        $deletedCount++
    } catch {
        $errors += "Erreur suppression $($_.Name): $_"
    }
}

# Supprimer fichiers HTML de test/demo
Write-Host "`n🌐 Suppression des fichiers HTML de test..." -ForegroundColor Yellow
$htmlToDelete = @("dashboard-*.html", "*-demo.html", "*-test.html", "*-simple.html", "*-fixed.html")
foreach ($pattern in $htmlToDelete) {
    Get-ChildItem -Path . -Filter $pattern -ErrorAction SilentlyContinue | Where-Object {
        $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*dist*"
    } | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force
            Write-Host "  ✅ Supprimé: $($_.Name)" -ForegroundColor Green
            $deletedCount++
        } catch {
            $errors += "Erreur suppression $($_.Name): $_"
        }
    }
}

# Résumé
Write-Host "`n📊 Résumé du nettoyage:" -ForegroundColor Cyan
Write-Host "  ✅ $deletedCount fichier(s) supprimé(s)" -ForegroundColor Green

if ($errors.Count -gt 0) {
    Write-Host "`n⚠️  Erreurs rencontrées:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

Write-Host "`n✨ Nettoyage terminé!" -ForegroundColor Green


