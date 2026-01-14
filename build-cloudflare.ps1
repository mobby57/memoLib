#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build optimisé pour Cloudflare Pages (Windows PowerShell)
.DESCRIPTION
    Build Next.js avec vérifications et optimisations pour déploiement Cloudflare
#>

Write-Host "🚀 Starting Cloudflare Pages Build..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. VÉRIFICATIONS PRÉ-BUILD
# ============================================
Write-Host "📋 Step 1: Pre-build checks..." -ForegroundColor Yellow

# Vérifier Node.js version
$nodeVersion = node --version
Write-Host "   Node.js version: $nodeVersion" -ForegroundColor Gray

if ([int]$nodeVersion.Split('.')[0].Substring(1) -lt 18) {
    Write-Host "❌ Node.js 18+ required!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pre-build checks passed" -ForegroundColor Green
Write-Host ""

# ============================================
# 2. NETTOYAGE
# ============================================
Write-Host "🧹 Step 2: Cleaning previous builds..." -ForegroundColor Yellow

if (Test-Path "out") {
    Remove-Item -Recurse -Force "out"
    Write-Host "   ✓ Removed out/" -ForegroundColor Gray
}

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "   ✓ Removed .next/" -ForegroundColor Gray
}

Write-Host "✅ Cleanup done" -ForegroundColor Green
Write-Host ""

# ============================================
# 3. BUILD NEXT.JS
# ============================================
Write-Host "⚙️  Step 3: Building Next.js application..." -ForegroundColor Yellow

$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NODE_ENV = "production"

try {
    npx next build
    if ($LASTEXITCODE -ne 0) {
        throw "Next.js build failed"
    }
    Write-Host "✅ Next.js build completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 4. POST-BUILD OPTIMISATIONS
# ============================================
Write-Host "🎨 Step 4: Post-build optimizations..." -ForegroundColor Yellow

# Copier fichiers statiques
$filesToCopy = @(
    @{ src = "public\robots.txt"; dest = "out\robots.txt" },
    @{ src = "public\sitemap.xml"; dest = "out\sitemap.xml" },
    @{ src = "public\_headers"; dest = "out\_headers" },
    @{ src = "public\_redirects"; dest = "out\_redirects" },
    @{ src = "public\manifest.json"; dest = "out\manifest.json" }
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file.src) {
        Copy-Item $file.src $file.dest -Force
        Write-Host "   ✓ Copied $($file.src)" -ForegroundColor Gray
    }
}

Write-Host "✅ Optimizations done" -ForegroundColor Green
Write-Host ""

# ============================================
# 5. STATISTIQUES BUILD
# ============================================
Write-Host "📊 Build Statistics:" -ForegroundColor Yellow

if (Test-Path "out") {
    $files = Get-ChildItem -Path "out" -Recurse -File
    $totalFiles = $files.Count
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    
    Write-Host "   📁 Total files: $totalFiles" -ForegroundColor Gray
    Write-Host "   💾 Total size: $totalSizeMB MB" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
Write-Host "📦 Output directory: .\out" -ForegroundColor Cyan
Write-Host "🚀 Ready for Cloudflare Pages deployment" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 6. INSTRUCTIONS DÉPLOIEMENT
# ============================================
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy: wrangler pages deploy out --project-name=iaposte-manager" -ForegroundColor Gray
Write-Host "  2. Or push to GitHub (auto-deploy)" -ForegroundColor Gray
Write-Host "  3. Configure secrets in Cloudflare Dashboard" -ForegroundColor Gray
Write-Host ""
