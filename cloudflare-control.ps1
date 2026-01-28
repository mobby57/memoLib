# ============================================
# CLOUDFLARE CONTROL CENTER
# Interface centralisee pour toutes les operations
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("test", "status", "deploy", "config", "d1", "help")]
    [string]$Action = "help"
)

$PRODUCTION_URL = "https://memoLib.pages.dev"

function Show-Menu {
    Write-Host "`n====================================================" -ForegroundColor Cyan
    Write-Host "  CLOUDFLARE CONTROL CENTER - IA POSTE MANAGER" -ForegroundColor Cyan
    Write-Host "====================================================`n" -ForegroundColor Cyan
    
    Write-Host "URL Production: $PRODUCTION_URL" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Actions disponibles:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [1] test    - Tests de production" -ForegroundColor White
    Write-Host "  [2] status  - Verifier le statut du site" -ForegroundColor White
    Write-Host "  [3] deploy  - Deploiement manuel" -ForegroundColor White
    Write-Host "  [4] config  - Configuration variables env" -ForegroundColor White
    Write-Host "  [5] d1      - Migration base de donnees D1" -ForegroundColor White
    Write-Host "  [6] help    - Afficher cette aide" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  .\cloudflare-control.ps1 test" -ForegroundColor Gray
    Write-Host "  .\cloudflare-control.ps1 status" -ForegroundColor Gray
    Write-Host "  .\cloudflare-control.ps1 -Action test" -ForegroundColor Gray
    Write-Host ""
}

switch ($Action) {
    "test" {
        Write-Host "`nLancement des tests de production..." -ForegroundColor Yellow
        powershell -ExecutionPolicy Bypass -File .\test-production-simple.ps1 -Full
    }
    
    "status" {
        Write-Host "`nVerification du statut..." -ForegroundColor Yellow
        
        try {
            $response = Invoke-WebRequest -Uri $PRODUCTION_URL -Method Head -UseBasicParsing -TimeoutSec 10
            
            Write-Host ""
            Write-Host "[SUCCESS] Site operationnel" -ForegroundColor Green
            Write-Host "   Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor White
            
            $cfRay = $response.Headers['CF-Ray']
            if ($cfRay) {
                Write-Host "   CDN: Cloudflare (Ray: $cfRay)" -ForegroundColor White
            }
            
            Write-Host ""
        } catch {
            Write-Host ""
            Write-Host "[ERROR] Site inaccessible" -ForegroundColor Red
            Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
        }
    }
    
    "deploy" {
        Write-Host "`nDeploiement manuel..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Etapes:" -ForegroundColor Cyan
        Write-Host "   1. Build de l'application" -ForegroundColor White
        Write-Host "   2. Generation client Prisma" -ForegroundColor White
        Write-Host "   3. Upload vers Cloudflare Pages" -ForegroundColor White
        Write-Host ""
        
        $confirm = Read-Host "Continuer? (o/N)"
        if ($confirm -eq 'o' -or $confirm -eq 'O') {
            npm run pages:deploy
        } else {
            Write-Host "Deploiement annule" -ForegroundColor Yellow
        }
    }
    
    "config" {
        Write-Host "`nConfiguration variables d'environnement..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Variables requises:" -ForegroundColor Cyan
        Write-Host "   - DATABASE_URL" -ForegroundColor White
        Write-Host "   - NEXTAUTH_SECRET" -ForegroundColor White
        Write-Host "   - NEXTAUTH_URL" -ForegroundColor White
        Write-Host ""
        Write-Host "Options de configuration:" -ForegroundColor Yellow
        Write-Host "   [1] Via Dashboard Cloudflare (recommande)" -ForegroundColor White
        Write-Host "       https://dash.cloudflare.com" -ForegroundColor Gray
        Write-Host "       Pages -> iaposte-manager -> Settings -> Environment Variables" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   [2] Via CLI Wrangler" -ForegroundColor White
        Write-Host "       wrangler pages secret put DATABASE_URL" -ForegroundColor Gray
        Write-Host "       wrangler pages secret put NEXTAUTH_SECRET" -ForegroundColor Gray
        Write-Host "       wrangler pages secret put NEXTAUTH_URL" -ForegroundColor Gray
        Write-Host ""
    }
    
    "d1" {
        Write-Host "`nMigration Cloudflare D1..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Database ID: a86c51c6-2031-4ae6-941c-db4fc917826c" -ForegroundColor White
        Write-Host "Database Name: iaposte-production-db" -ForegroundColor White
        Write-Host ""
        
        $confirm = Read-Host "Lancer la migration? (o/N)"
        if ($confirm -eq 'o' -or $confirm -eq 'O') {
            powershell -ExecutionPolicy Bypass -File .\cloudflare-migrate-d1.ps1 -All
        } else {
            Write-Host "Migration annulee" -ForegroundColor Yellow
        }
    }
    
    "help" {
        Show-Menu
    }
    
    default {
        Show-Menu
    }
}

Write-Host ""
