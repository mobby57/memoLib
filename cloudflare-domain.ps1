# Configuration Domaine Custom - Cloudflare Pages
# Script simplifie sans caracteres speciaux

param(
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$ListOnly
)

$ProjectName = "iapostemanage"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Cloudflare Pages - Custom Domain" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verification authentification
Write-Host "Verification authentification Wrangler..." -ForegroundColor Yellow
try {
    $null = wrangler pages project list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR: Non authentifie. Executez: wrangler login" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: Authentifie avec succes" -ForegroundColor Green
} catch {
    Write-Host "ERREUR: Probleme d'authentification" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Mode liste
if ($ListOnly) {
    Write-Host "Domaines configures actuellement:" -ForegroundColor Yellow
    Write-Host ""
    wrangler pages domain list --project-name $ProjectName
    exit 0
}

# Menu interactif
Write-Host "Menu Configuration" -ForegroundColor Cyan
Write-Host "1. Lister les domaines actuels"
Write-Host "2. Ajouter un nouveau domaine"
Write-Host "3. Voir la documentation DNS"
Write-Host "4. Ouvrir le dashboard Cloudflare"
Write-Host "0. Quitter"
Write-Host ""

$choice = Read-Host "Selectionnez une option"

switch ($choice) {
    "1" {
        Write-Host ""
        wrangler pages domain list --project-name $ProjectName
    }
    "2" {
        $newDomain = Read-Host "Entrez le domaine (ex: memoLib.com)"
        if ($newDomain) {
            Write-Host ""
            Write-Host "Ajout du domaine: $newDomain" -ForegroundColor Green
            Write-Host ""
            
            wrangler pages domain add $newDomain --project-name $ProjectName
            
            Write-Host ""
            Write-Host "Prochaines etapes:" -ForegroundColor Yellow
            Write-Host "1. Configurer les enregistrements DNS"
            Write-Host "2. Attendre la propagation (5-30 min)"
            Write-Host "3. Verifier le certificat SSL"
            Write-Host ""
            Write-Host "Configuration DNS requise:" -ForegroundColor Yellow
            Write-Host "CNAME  $newDomain  ->  $ProjectName.pages.dev" -ForegroundColor Green
            Write-Host "CNAME  www.$newDomain  ->  $ProjectName.pages.dev" -ForegroundColor Green
        }
    }
    "3" {
        Write-Host ""
        Write-Host "Configuration DNS:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Pour domaine racine (exemple.com):" -ForegroundColor Cyan
        Write-Host "  CNAME  @    ->  $ProjectName.pages.dev"
        Write-Host "  CNAME  www  ->  $ProjectName.pages.dev"
        Write-Host ""
        Write-Host "Pour sous-domaine (app.exemple.com):" -ForegroundColor Cyan
        Write-Host "  CNAME  app  ->  $ProjectName.pages.dev"
        Write-Host ""
        Write-Host "Si CNAME @ non supporte:" -ForegroundColor Yellow
        Write-Host "  A     @  ->  104.21.0.0"
        Write-Host "  AAAA  @  ->  2606:4700:0:0:0:0:6810:1500"
        Write-Host ""
    }
    "4" {
        Write-Host ""
        Write-Host "Ouverture du dashboard Cloudflare..." -ForegroundColor Cyan
        Start-Process "https://dash.cloudflare.com/b8fe52a9c1217b3bb71b53c26d0acfab/pages/view/$ProjectName"
    }
    "0" {
        Write-Host ""
        Write-Host "Au revoir!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "Option invalide" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Script termine" -ForegroundColor Green
Write-Host ""
