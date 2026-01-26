# Script de nettoyage - iaPostemanage
# Supprime les fichiers temporaires et inutiles

Write-Host "🧹 Nettoyage du projet..." -ForegroundColor Cyan

# Dossiers temporaires de build Azure
$tempDirs = @(
    "32c98bd1-04fa-40e5-90fc-29bc92148d3e-swa-oryx",
    "5f0ee45d-5e22-496b-96be-797cc35f6f0e-swa-oryx",
    "ae0d827e-e6c3-4e14-8471-8f3f126daf67-swa-oryx",
    "fadec518-a405-4d3f-8a6c-d482e3a90345-swa-oryx"
)

foreach ($dir in $tempDirs) {
    if (Test-Path $dir) {
        Write-Host "  Suppression: $dir" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir
    }
}

# Logs de build
$buildLogs = Get-ChildItem -Filter "build-*.txt" -File
$buildLogs += Get-ChildItem -Filter "build-*.log" -File
$buildLogs += Get-ChildItem -Filter "tsc-output.txt" -File
$buildLogs += Get-ChildItem -Filter "typescript-errors.txt" -File

foreach ($log in $buildLogs) {
    Write-Host "  Suppression: $($log.Name)" -ForegroundColor Yellow
    Remove-Item $log.FullName -Force
}

# Fichiers backup
$backups = Get-ChildItem -Filter "*.bak" -File
$backups += Get-ChildItem -Filter "*.backup" -File

foreach ($backup in $backups) {
    Write-Host "  Suppression: $($backup.Name)" -ForegroundColor Yellow
    Remove-Item $backup.FullName -Force
}

# Fichiers .env inutiles (garder .env.local et .env.production)
$envToDelete = @(
    ".env.me",
    ".env.previous",
    ".env.keys",
    ".env.vault",
    ".env.vercel.check",
    ".env.cloudflare"
)

foreach ($env in $envToDelete) {
    if (Test-Path $env) {
        Write-Host "  Suppression: $env" -ForegroundColor Yellow
        Remove-Item $env -Force
    }
}

# Fichiers temporaires divers
$tempFiles = @(
    "temp_*.txt",
    "test-report-*.txt",
    "ascii-conversion-report.txt",
    "bugs-report.json",
    "database-test-report.json",
    "migration-report.json",
    "performance-metrics.json"
)

foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Filter $pattern -File
    foreach ($file in $files) {
        Write-Host "  Suppression: $($file.Name)" -ForegroundColor Yellow
        Remove-Item $file.FullName -Force
    }
}

Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Fichiers conservés:" -ForegroundColor Cyan
Write-Host "  - .env.local (dev)"
Write-Host "  - .env.production (prod)"
Write-Host "  - Scripts essentiels (start.ps1, build.ps1, etc.)"
