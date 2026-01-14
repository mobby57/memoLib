#!/usr/bin/env pwsh
# Script de déploiement complet Cloudflare
# IA Poste Manager - Automatisation complète

param(
    [switch]$SkipBuild,
    [switch]$SkipMigration,
    [switch]$Production
)

Write-Host "🚀 Déploiement Cloudflare - IA Poste Manager" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$PROJECT_NAME = "iaposte-manager"
$ErrorActionPreference = "Stop"

# Fonction de vérification
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction SilentlyContinue) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Vérifier les prérequis
Write-Host "`n🔍 Vérification des prérequis..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js non installé!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "wrangler")) {
    Write-Host "❌ Wrangler CLI non installé!" -ForegroundColor Red
    Write-Host "   Installer avec: npm install -g wrangler" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Prérequis OK" -ForegroundColor Green

# 1. Build de l'application
if (-not $SkipBuild) {
    Write-Host "`n1️⃣ Build de l'application..." -ForegroundColor Yellow
    
    try {
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erreur de build!" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "   ✅ Build réussi!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n1️⃣ Build skippé (--SkipBuild)" -ForegroundColor Gray
}

# 2. Migration D1
if (-not $SkipMigration) {
    Write-Host "`n2️⃣ Migration base de données D1..." -ForegroundColor Yellow
    
    try {
        .\scripts\migrate-to-d1.ps1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ⚠️  Migration échouée - continuer quand même?" -ForegroundColor Yellow
            $continue = Read-Host "Continuer (y/n)?"
            if ($continue -ne 'y') {
                exit 1
            }
        } else {
            Write-Host "   ✅ Migration réussie!" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Erreur migration: $_" -ForegroundColor Yellow
        $continue = Read-Host "Continuer (y/n)?"
        if ($continue -ne 'y') {
            exit 1
        }
    }
} else {
    Write-Host "`n2️⃣ Migration skippée (--SkipMigration)" -ForegroundColor Gray
}

# 3. Vérification du dossier de build
Write-Host "`n3️⃣ Vérification du dossier de build..." -ForegroundColor Yellow

if (-not (Test-Path "out")) {
    Write-Host "   ❌ Dossier 'out' non trouvé!" -ForegroundColor Red
    Write-Host "   Lancez 'npm run build' d'abord" -ForegroundColor Yellow
    exit 1
}

$fileCount = (Get-ChildItem -Path "out" -Recurse -File).Count
Write-Host "   📁 $fileCount fichiers trouvés dans 'out/'" -ForegroundColor Cyan
Write-Host "   ✅ Dossier de build OK" -ForegroundColor Green

# 4. Déploiement sur Cloudflare Pages
Write-Host "`n4️⃣ Déploiement sur Cloudflare Pages..." -ForegroundColor Yellow

try {
    if ($Production) {
        Write-Host "   🚀 Mode PRODUCTION" -ForegroundColor Magenta
        wrangler pages deploy out --project-name=$PROJECT_NAME --branch=main
    } else {
        Write-Host "   🧪 Mode PREVIEW" -ForegroundColor Cyan
        wrangler pages deploy out --project-name=$PROJECT_NAME --branch=preview
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erreur de déploiement!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   ✅ Déploiement réussi!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

# 5. Récupération de l'URL
Write-Host "`n5️⃣ Récupération de l'URL du déploiement..." -ForegroundColor Yellow

$url = if ($Production) {
    "https://$PROJECT_NAME.pages.dev"
} else {
    "https://preview-$PROJECT_NAME.pages.dev"
}

Write-Host "   🌐 URL: $url" -ForegroundColor Cyan

# 6. Tests post-déploiement
Write-Host "`n6️⃣ Tests de santé..." -ForegroundColor Yellow

Start-Sleep -Seconds 5  # Attendre que le déploiement se propage

try {
    $response = Invoke-WebRequest -Uri "$url/api/health" -Method GET -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ API Health OK (200)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  API Health: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  API Health check échoué (normal si endpoint manquant)" -ForegroundColor Yellow
}

# 7. Vérification D1
Write-Host "`n7️⃣ Vérification D1..." -ForegroundColor Yellow

try {
    $d1Test = wrangler d1 execute iaposte-production-db --command "SELECT COUNT(*) as count FROM User" --remote 2>&1
    if ($d1Test -match "count") {
        Write-Host "   ✅ D1 accessible" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  D1 - vérification manuelle recommandée" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  D1 - impossible de vérifier" -ForegroundColor Yellow
}

# Résumé final
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n📊 Résumé:" -ForegroundColor Yellow
Write-Host "   🌐 URL: $url" -ForegroundColor White
Write-Host "   📁 Fichiers: $fileCount" -ForegroundColor White
Write-Host "   🗄️  Base: D1 (iaposte-production-db)" -ForegroundColor White
Write-Host "   🚀 Mode: $(if ($Production) { 'PRODUCTION' } else { 'PREVIEW' })" -ForegroundColor White

Write-Host "`n📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Tester l'application: $url" -ForegroundColor White
Write-Host "   2. Vérifier les logs: wrangler pages deployment tail --project-name=$PROJECT_NAME" -ForegroundColor White
Write-Host "   3. Configurer domaine personnalisé (optionnel)" -ForegroundColor White
Write-Host "   4. Activer Web Analytics dans Cloudflare Dashboard" -ForegroundColor White

Write-Host "`n🎉 Félicitations - Application déployée!" -ForegroundColor Cyan
