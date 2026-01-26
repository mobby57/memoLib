#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build optimise pour Cloudflare Pages (Windows PowerShell)
.DESCRIPTION
    Build Next.js avec verifications et optimisations pour deploiement Cloudflare
#>

Write-Output "[START] Starting Cloudflare Pages Build..."
Write-Output ""

# ============================================
# 1. VERIFICATIONS PRE-BUILD
# ============================================
Write-Output "[STEP 1] Pre-build checks..."

# Verifier Node.js version
$nodeVersion = node --version
Write-Output "   Node.js version: $nodeVersion"

if ([int]$nodeVersion.Split('.')[0].Substring(1) -lt 18) {
    Write-Output "[ERREUR] Node.js 18+ required!"
    exit 1
}

Write-Output "[OK] Pre-build checks passed"
Write-Output ""

# ============================================
# 2. NETTOYAGE
# ============================================
Write-Output "[STEP 2] Cleaning previous builds..."

if (Test-Path "out") {
    Remove-Item -Recurse -Force "out"
    Write-Output "   - Removed out/"
}

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Output "   - Removed .next/"
}

Write-Output "[OK] Cleanup done"
Write-Output ""

# ============================================
# 3. BUILD NEXT.JS
# ============================================
Write-Output "[STEP 3] Building Next.js application..."

$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NODE_ENV = "production"

try {
    npx next build
    if ($LASTEXITCODE -ne 0) {
        throw "Next.js build failed"
    }
    Write-Output "[OK] Next.js build completed"
} catch {
    Write-Output "[ERREUR] Build failed: $_"
    exit 1
}

Write-Output ""

# ============================================
# 4. POST-BUILD OPTIMISATIONS
# ============================================
Write-Output "[STEP 4] Post-build optimizations..."

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
        Write-Output "   - Copied $($file.src)"
    }
}

Write-Output "[OK] Post-build done"
Write-Output ""

# ============================================
# 5. VERIFICATION FINALE
# ============================================
Write-Output "[STEP 5] Final verification..."

if (Test-Path "out") {
    $fileCount = (Get-ChildItem -Recurse "out" -File).Count
    $totalSize = [math]::Round((Get-ChildItem -Recurse "out" | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    
    Write-Output "   Files: $fileCount"
    Write-Output "   Total size: ${totalSize} MB"
    Write-Output "[OK] Build ready for deployment"
} else {
    Write-Output "[WARN] Output directory not found"
}

Write-Output ""
Write-Output "========================================"
Write-Output "  BUILD COMPLETE"
Write-Output "========================================"
Write-Output ""
Write-Output "Deploy with: wrangler pages deploy out"
Write-Output ""
