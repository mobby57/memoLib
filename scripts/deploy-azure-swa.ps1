# ============================================
# 🚀 Azure Static Web Apps Deployment Script
# ============================================
# Déploie l'application Next.js sur Azure SWA
# Usage: ./scripts/deploy-azure-swa.ps1 [-Static] [-SkipBuild]
# ============================================

param(
    [switch]$Static,      # Utiliser export statique pur (sans API routes)
    [switch]$SkipBuild,   # Sauter le build (si déjà construit)
    [switch]$DryRun,      # Afficher les commandes sans les exécuter
    [switch]$KeepSentry   # Garder Sentry activé (peut causer des erreurs)
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot

Set-Location $projectRoot

# Colors
function Write-Step($message) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " 🔷 $message" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host " ✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host " ⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host " ❌ $message" -ForegroundColor Red
}

# Sentry files to disable during Azure build
$sentryFiles = @(
    "instrumentation.ts",
    "instrumentation-client.ts",
    "sentry.server.config.ts",
    "sentry.edge.config.ts"
)

function Disable-Sentry {
    Write-Step "Désactivation temporaire de Sentry"
    foreach ($file in $sentryFiles) {
        $filePath = Join-Path $projectRoot $file
        if (Test-Path $filePath) {
            Rename-Item $filePath "$filePath.azure-disabled" -Force
            Write-Success "Désactivé: $file"
        }
    }
}

function Restore-Sentry {
    Write-Step "Restauration de Sentry"
    foreach ($file in $sentryFiles) {
        $disabledPath = Join-Path $projectRoot "$file.azure-disabled"
        $originalPath = Join-Path $projectRoot $file
        if (Test-Path $disabledPath) {
            Rename-Item $disabledPath $originalPath -Force
            Write-Success "Restauré: $file"
        }
    }
}

# Header
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║    🚀 Azure Static Web Apps - Deployment Script           ║" -ForegroundColor Magenta
Write-Host "║    iaPosteManager - Next.js Application                   ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Mode selection
if ($Static) {
    Write-Host "📦 Mode: STATIC EXPORT (output: 'export')" -ForegroundColor Yellow
    $buildMode = "static"
    $outputDir = "out"
    $env:AZURE_STATIC_EXPORT = "true"
    $env:AZURE_STATIC_WEB_APPS = "false"
} else {
    Write-Host "📦 Mode: HYBRID (Server-Side Rendering)" -ForegroundColor Cyan
    $buildMode = "hybrid"
    $outputDir = ".next"
    $env:AZURE_STATIC_WEB_APPS = "true"
    $env:AZURE_STATIC_EXPORT = "false"
}

try {
    # Step 1: Disable Sentry if not keeping it
    if (-not $KeepSentry) {
        Disable-Sentry
    } else {
        Write-Warning "Sentry restera activé - peut causer des erreurs de build"
    }

    # Step 2: Clean previous build
    Write-Step "Nettoyage du build précédent"
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
        Write-Success "Dossier .next supprimé"
    }
    if ($Static -and (Test-Path "out")) {
        Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue
        Write-Success "Dossier out supprimé"
    }

    # Step 3: Install dependencies
    Write-Step "Vérification des dépendances"
    if (-not $DryRun) {
        # Check if node_modules exists and is up to date
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installation des dépendances..." -ForegroundColor Yellow
            npm ci --legacy-peer-deps
        }
        Write-Success "Dépendances OK"
    }

    # Step 4: Generate Prisma client
    Write-Step "Génération du client Prisma"
    if (-not $DryRun) {
        npx prisma generate 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Client Prisma généré"
        } else {
            Write-Warning "Prisma generate a échoué (ignoré)"
        }
    }

    # Step 5: Build the application
    if (-not $SkipBuild) {
        Write-Step "Construction de l'application Next.js ($buildMode)"
        
        if (-not $DryRun) {
            if ($Static) {
                & npm run build:azure:static
            } else {
                & npm run build:azure
            }
            
            if ($LASTEXITCODE -ne 0) {
                throw "Échec du build Next.js"
            }
            Write-Success "Application construite avec succès"
        }
    } else {
        Write-Warning "Build sauté (--SkipBuild)"
    }

    # Step 6: Verify build output
    Write-Step "Vérification du build"
    
    if (Test-Path $outputDir) {
        $buildSize = [math]::Round((Get-ChildItem $outputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        Write-Success "Dossier de sortie: $outputDir"
        Write-Success "Taille du build: $buildSize MB"
        
        if (-not $Static -and $buildSize -gt 250) {
            Write-Warning "⚠️ Le build dépasse 250 MB! Azure SWA Hybrid a une limite de 250 MB."
        }
    } else {
        throw "Dossier de sortie '$outputDir' non trouvé!"
    }

    # Summary
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    ✅ BUILD RÉUSSI                        ║" -ForegroundColor Green
    Write-Host "╠═══════════════════════════════════════════════════════════╣" -ForegroundColor Green
    Write-Host "║  Mode:        $buildMode                                  " -ForegroundColor Green
    Write-Host "║  Output:      $outputDir                                  " -ForegroundColor Green
    Write-Host "║  Taille:      $buildSize MB                               " -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green

} catch {
    Write-Error $_.Exception.Message
    exit 1
} finally {
    # Always restore Sentry files
    if (-not $KeepSentry) {
        Restore-Sentry
    }
}

Write-Host ""
Write-Host "📋 Prochaines étapes pour déployer:" -ForegroundColor Cyan
Write-Host "   git add . && git commit -m 'Azure SWA build' && git push" -ForegroundColor Yellow
Write-Host ""
