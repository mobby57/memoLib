#!/usr/bin/env pwsh
# Render.com Deployment Script

$ErrorActionPreference = "Stop"

Write-Host "`n=== RENDER.COM DEPLOYMENT ===" -ForegroundColor Cyan

# Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git not found!" -ForegroundColor Red
    exit 1
}

# Check files
$files = @("render.yaml", "requirements.txt", "build.sh", "start.sh")
foreach ($f in $files) {
    if (-not (Test-Path $f)) {
        Write-Host "ERROR: $f not found!" -ForegroundColor Red
        exit 1
    }
}

# Get current branch
$branch = git branch --show-current
if ($branch -ne "main") {
    Write-Host "Switching to main branch..." -ForegroundColor Yellow
    git checkout main
}

# Add and commit
git add .
$status = git status --porcelain
if ($status) {
    $msg = Read-Host "Commit message (or press Enter for default)"
    if (-not $msg) { $msg = "deploy: Update for Render.com" }
    git commit -m $msg
    Write-Host "Committed successfully" -ForegroundColor Green
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}

# Push
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS! Code pushed to GitHub" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://render.com" -ForegroundColor White
    Write-Host "2. Sign up with GitHub" -ForegroundColor White
    Write-Host "3. New > Blueprint" -ForegroundColor White
    Write-Host "4. Connect: mobby57/iapm.com" -ForegroundColor Cyan
    Write-Host "5. Click Apply" -ForegroundColor Green
    Write-Host "6. Wait 3-5 minutes" -ForegroundColor White
    Write-Host "7. URL: https://iapostemanager.onrender.com`n" -ForegroundColor Cyan
    
    $open = Read-Host "Open Render.com now? (Y/N)"
    if ($open -eq "Y" -or $open -eq "y") {
        Start-Process "https://render.com"
    }
} else {
    Write-Host "ERROR: Push failed!" -ForegroundColor Red
    exit 1
}
