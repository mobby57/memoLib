# Installation et Demarrage Cloudflare Tunnel
# IA Poste Manager

Write-Host ""
Write-Host "CLOUDFLARE TUNNEL - INSTALLATION & DEMARRAGE" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verifier si cloudflared est installe
Write-Host "[1/3] Verification de cloudflared..." -ForegroundColor Yellow

try {
    $version = cloudflared --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Cloudflared deja installe: $version" -ForegroundColor Green
        $installed = $true
    } else {
        $installed = $false
    }
} catch {
    $installed = $false
}

if (-not $installed) {
    Write-Host "Cloudflared n'est pas installe." -ForegroundColor Red
    Write-Host ""
    Write-Host "Options d'installation:" -ForegroundColor Yellow
    Write-Host "  1. Winget (Recommande):     winget install --id Cloudflare.cloudflared" -ForegroundColor White
    Write-Host "  2. Chocolatey:              choco install cloudflared" -ForegroundColor White
    Write-Host "  3. Telechargement manuel:   https://github.com/cloudflare/cloudflared/releases" -ForegroundColor White
    Write-Host ""
    
    $install = Read-Host "Voulez-vous installer avec Winget maintenant? (o/n)"
    
    if ($install -eq "o" -or $install -eq "O") {
        Write-Host "Installation de cloudflared via Winget..." -ForegroundColor Yellow
        winget install --id Cloudflare.cloudflared
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Installation reussie!" -ForegroundColor Green
            Write-Host "Redemarrez PowerShell pour que PATH soit mis a jour." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Apres redemarrage, executez:" -ForegroundColor Cyan
            Write-Host "  .\setup-cloudflare-auto.ps1" -ForegroundColor White
            Write-Host ""
            Read-Host "Appuyez sur Entree pour fermer"
            exit
        } else {
            Write-Host "Erreur d'installation. Installez manuellement et relancez ce script." -ForegroundColor Red
            Read-Host "Appuyez sur Entree pour fermer"
            exit
        }
    } else {
        Write-Host ""
        Write-Host "Installation manuelle requise." -ForegroundColor Yellow
        Write-Host "Consultez: CLOUDFLARE_QUICKSTART.md" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Appuyez sur Entree pour fermer"
        exit
    }
}

Write-Host ""

# Verifier si Next.js tourne
Write-Host "[2/3] Verification du serveur Next.js..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing 2>$null
    $nextjsRunning = $true
    Write-Host "Next.js deja en cours d'execution sur port 3000" -ForegroundColor Green
} catch {
    $nextjsRunning = $false
    Write-Host "Next.js n'est pas en cours d'execution" -ForegroundColor Yellow
    Write-Host "Demarrage de Next.js..." -ForegroundColor Yellow
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    
    Write-Host "Attente 15 secondes pour le demarrage de Next.js..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

Write-Host ""

# Demarrer Cloudflare Tunnel
Write-Host "[3/3] Demarrage du tunnel Cloudflare..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Mode: Quick Tunnel (URL temporaire)" -ForegroundColor Cyan
Write-Host "Note: L'URL changera a chaque redemarrage" -ForegroundColor Yellow
Write-Host ""

Write-Host "Tunnel en cours de demarrage..." -ForegroundColor Yellow
Write-Host "L'URL publique s'affichera dans quelques secondes..." -ForegroundColor Yellow
Write-Host ""

# Demarrer le tunnel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'CLOUDFLARE TUNNEL - IA POSTE MANAGER' -ForegroundColor Cyan; Write-Host ''; cloudflared tunnel --url http://localhost:3000"

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "SERVICES ACTIFS:" -ForegroundColor Green
Write-Host "  Local:   http://localhost:3000" -ForegroundColor White
Write-Host "  Public:  Verifiez la fenetre Cloudflare Tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "PAGES DISPONIBLES:" -ForegroundColor Cyan
Write-Host "  Dashboard:  http://localhost:3000/lawyer" -ForegroundColor White
Write-Host "  Monitoring: http://localhost:3000/lawyer/monitoring" -ForegroundColor White
Write-Host "  Emails:     http://localhost:3000/lawyer/emails" -ForegroundColor White
Write-Host ""
Write-Host "Note: L'URL publique Cloudflare s'affiche dans le terminal du tunnel" -ForegroundColor Yellow
Write-Host "      Format: https://xxx-yyy-zzz.trycloudflare.com" -ForegroundColor Yellow
Write-Host ""

Read-Host "Appuyez sur Entree pour fermer"
