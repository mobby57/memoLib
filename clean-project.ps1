# MemoLib - Script de Nettoyage Automatique
# Usage: .\clean-project.ps1

param(
    [switch]$Deep,
    [switch]$DryRun
)

Write-Host "🧹 MemoLib - Nettoyage du Projet" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$itemsToRemove = @()

# Cache et Build Artifacts
$cacheItems = @(
    ".jest-cache",
    ".next",
    ".swc",
    ".turbo",
    ".wrangler",
    ".open-next",
    "coverage",
    "out-azure",
    "nextjs-app",
    ".cache_ggshield",
    ".tsbuildinfo"
)

# Logs
$logFiles = @(
    "*.log",
    "dev-error.log",
    "dev-output.log",
    "dev-server.log",
    "server.log",
    "build.log",
    "build-full.log",
    "build-output.log",
    "dev.log"
)

# Fichiers temporaires
$tempFiles = @(
    "temp_*.txt",
    "test-upload-temp.txt",
    "syntaxiquement",
    "valide"
)

# Reports
$reportFiles = @(
    "bugs-report.json",
    "database-test-report.json",
    "migration-report.json",
    "performance-metrics.json",
    "ascii-conversion-report.txt",
    "type-errors.txt",
    "type-errors-new.txt"
)

# Test Results
$testItems = @(
    "test-results",
    "playwright-report"
)

Write-Host "📦 Nettoyage des caches..." -ForegroundColor Yellow
foreach ($item in $cacheItems) {
    if (Test-Path $item) {
        $itemsToRemove += $item
        if (-not $DryRun) {
            Remove-Item -Recurse -Force $item -ErrorAction SilentlyContinue
            Write-Host "  ✓ Supprimé: $item" -ForegroundColor Green
        } else {
            Write-Host "  [DRY-RUN] Supprimerait: $item" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "📝 Nettoyage des logs..." -ForegroundColor Yellow
foreach ($pattern in $logFiles) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $itemsToRemove += $file.Name
        if (-not $DryRun) {
            Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Supprimé: $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "  [DRY-RUN] Supprimerait: $($file.Name)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "🗑️  Nettoyage des fichiers temporaires..." -ForegroundColor Yellow
foreach ($pattern in $tempFiles) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $itemsToRemove += $file.Name
        if (-not $DryRun) {
            Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Supprimé: $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "  [DRY-RUN] Supprimerait: $($file.Name)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "📊 Nettoyage des rapports..." -ForegroundColor Yellow
foreach ($file in $reportFiles) {
    if (Test-Path $file) {
        $itemsToRemove += $file
        if (-not $DryRun) {
            Remove-Item $file -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Supprimé: $file" -ForegroundColor Green
        } else {
            Write-Host "  [DRY-RUN] Supprimerait: $file" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "🧪 Nettoyage des résultats de tests..." -ForegroundColor Yellow
foreach ($item in $testItems) {
    if (Test-Path $item) {
        $itemsToRemove += $item
        if (-not $DryRun) {
            Remove-Item -Recurse -Force $item -ErrorAction SilentlyContinue
            Write-Host "  ✓ Supprimé: $item" -ForegroundColor Green
        } else {
            Write-Host "  [DRY-RUN] Supprimerait: $item" -ForegroundColor Gray
        }
    }
}

# Nettoyage profond (optionnel)
if ($Deep) {
    Write-Host ""
    Write-Host "🔥 Nettoyage PROFOND activé..." -ForegroundColor Red
    
    $deepItems = @(
        "node_modules",
        "backups",
        "dbcodeio-public",
        "app-sentry-backup"
    )
    
    foreach ($item in $deepItems) {
        if (Test-Path $item) {
            $itemsToRemove += $item
            if (-not $DryRun) {
                Write-Host "  ⚠️  Suppression de $item (peut prendre du temps)..." -ForegroundColor Yellow
                Remove-Item -Recurse -Force $item -ErrorAction SilentlyContinue
                Write-Host "  ✓ Supprimé: $item" -ForegroundColor Green
            } else {
                Write-Host "  [DRY-RUN] Supprimerait: $item" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "🔍 Mode DRY-RUN: Aucun fichier supprimé" -ForegroundColor Yellow
    Write-Host "   Exécutez sans -DryRun pour nettoyer réellement" -ForegroundColor Gray
} else {
    Write-Host "✅ Nettoyage terminé!" -ForegroundColor Green
    Write-Host "   $($itemsToRemove.Count) éléments supprimés" -ForegroundColor Gray
}

if ($Deep -and -not $DryRun) {
    Write-Host ""
    Write-Host "💡 N'oubliez pas de réinstaller les dépendances:" -ForegroundColor Cyan
    Write-Host "   npm install" -ForegroundColor White
}

Write-Host ""
