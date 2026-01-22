# =========================================
# 🌐 Configuration Domaine Custom - Cloudflare Pages
# =========================================
# Script pour ajouter et configurer un domaine personnalisé
# sur Cloudflare Pages pour IA Poste Manager
# =========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$ListOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$CheckDNS,
    
    [Parameter(Mandatory=$false)]
    [switch]$UpdateEnvVars
)

$ProjectName = "iapostemanage"
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🌐 Cloudflare Pages - Custom Domain" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# =========================================
# Fonction: Afficher les domaines actuels
# =========================================
function Show-CurrentDomains {
    Write-Host "📋 Domaines configurés actuellement:" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        wrangler pages domain list --project-name $ProjectName
    } catch {
        Write-Host "❌ Erreur lors de la récupération des domaines" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Gray
        exit 1
    }
}

# =========================================
# Fonction: Vérifier la connexion Wrangler
# =========================================
function Test-WranglerAuth {
    Write-Host "🔐 Vérification de l'authentification Wrangler..." -ForegroundColor Cyan
    
    try {
        $projects = wrangler pages project list 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Non authentifié. Exécutez: wrangler login" -ForegroundColor Red
            exit 1
        }
        Write-Host "✓ Authentifié avec succès" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur d'authentification" -ForegroundColor Red
        exit 1
    }
}

# =========================================
# Fonction: Ajouter un domaine custom
# =========================================
function Add-CustomDomain {
    param([string]$DomainToAdd)
    
    Write-Host ""
    Write-Host "➕ Ajout du domaine: $DomainToAdd" -ForegroundColor Green
    Write-Host ""
    
    try {
        wrangler pages domain add $DomainToAdd --project-name $ProjectName
        
        Write-Host ""
        Write-Host "✓ Domaine ajouté avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
        Write-Host "  1. Configurer les enregistrements DNS (voir ci-dessous)"
        Write-Host "  2. Attendre la propagation DNS (5-30 minutes)"
        Write-Host "  3. Vérifier le certificat SSL (automatique)"
        Write-Host "  4. Mettre à jour les variables d'environnement"
        Write-Host ""
        
        Show-DNSRecords -Domain $DomainToAdd
        
    } catch {
        Write-Host "❌ Erreur lors de l'ajout du domaine" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Gray
        
        if ($_.Exception.Message -match "already exists") {
            Write-Host ""
            Write-Host "ℹ️  Le domaine est peut-être déjà configuré." -ForegroundColor Yellow
            Show-CurrentDomains
        }
        
        exit 1
    }
}

# =========================================
# Fonction: Afficher les DNS requis
# =========================================
function Show-DNSRecords {
    param([string]$Domain)
    
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "📋 Enregistrements DNS à configurer" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Pour le domaine: $Domain" -ForegroundColor White
    Write-Host ""
    
    # Domaine racine vs sous-domaine
    if ($Domain -match "^([^.]+)\.([^.]+)\.([^.]+)$") {
        # Sous-domaine (ex: app.example.com)
        Write-Host "📌 Configuration pour sous-domaine:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Type   Nom/Host          Valeur/Target" -ForegroundColor White
        Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host "CNAME  $Domain    $ProjectName.pages.dev" -ForegroundColor Green
        
    } else {
        # Domaine racine (ex: example.com)
        Write-Host "📌 Configuration pour domaine racine:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Type   Nom/Host  Valeur/Target" -ForegroundColor White
        Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host "CNAME  @         $ProjectName.pages.dev" -ForegroundColor Green
        Write-Host "CNAME  www       $ProjectName.pages.dev" -ForegroundColor Green
        Write-Host ""
        Write-Host "Si CNAME @ n'est pas supporte (certains registrars):" -ForegroundColor Yellow
        Write-Host "A      @         104.21.0.0" -ForegroundColor Cyan
        Write-Host "AAAA   @         2606:4700:0:0:0:0:6810:1500" -ForegroundColor Cyan
        Write-Host "CNAME  www       $ProjectName.pages.dev" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "💡 TTL recommandé: Auto ou 3600 (1 heure)" -ForegroundColor Gray
    Write-Host ""
}

# =========================================
# Fonction: Vérifier DNS
# =========================================
function Test-DNSConfiguration {
    param([string]$Domain)
    
    Write-Host ""
    Write-Host "🔍 Vérification DNS pour: $Domain" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        $dnsResult = Resolve-DnsName -Name $Domain -Type A -ErrorAction SilentlyContinue
        
        if ($dnsResult) {
            Write-Host "✓ Domaine résout vers:" -ForegroundColor Green
            foreach ($record in $dnsResult) {
                if ($record.Type -eq "A") {
                    Write-Host "  IP: $($record.IPAddress)" -ForegroundColor White
                }
            }
        } else {
            Write-Host "Avertissement: Domaine ne resout pas encore" -ForegroundColor Yellow
            Write-Host "   Propagation DNS en cours (peut prendre jusqu'a 48h)" -ForegroundColor Gray
        }
        
        # Test CNAME
        $cnameResult = Resolve-DnsName -Name $Domain -Type CNAME -ErrorAction SilentlyContinue
        if ($cnameResult) {
            Write-Host "OK CNAME pointe vers: $($cnameResult.NameHost)" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "Avertissement: Impossible de verifier le DNS" -ForegroundColor Yellow
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Test HTTPS
    Write-Host "🔒 Test HTTPS..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -Method GET -UseBasicParsing -TimeoutSec 10
        Write-Host "✓ HTTPS accessible (HTTP $($response.StatusCode))" -ForegroundColor Green
        
        # Vérifier le certificat SSL
        Write-Host "✓ Certificat SSL actif" -ForegroundColor Green
        
    } catch {
        Write-Host "✗ HTTPS non accessible" -ForegroundColor Red
        Write-Host "   Attendez la propagation DNS et l'émission du certificat SSL" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# =========================================
# Fonction: Mettre à jour variables d'env
# =========================================
function Update-EnvironmentVariables {
    param([string]$Domain)
    
    Write-Host ""
    Write-Host "⚙️  Mise à jour des variables d'environnement" -ForegroundColor Cyan
    Write-Host ""
    
    $newUrl = "https://$Domain"
    
    Write-Host "NEXTAUTH_URL -> $newUrl" -ForegroundColor Yellow
    try {
        wrangler pages secret put NEXTAUTH_URL --project-name $ProjectName
        # Note: L'utilisateur devra entrer la valeur interactivement
        Write-Host "✓ NEXTAUTH_URL mis à jour" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur lors de la mise à jour de NEXTAUTH_URL" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "NEXT_PUBLIC_APP_URL -> $newUrl" -ForegroundColor Yellow
    try {
        wrangler pages secret put NEXT_PUBLIC_APP_URL --project-name $ProjectName
        Write-Host "✓ NEXT_PUBLIC_APP_URL mis à jour" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur lors de la mise à jour de NEXT_PUBLIC_APP_URL" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "📝 Redéploiement nécessaire pour appliquer les changements" -ForegroundColor Yellow
    Write-Host "   Exécutez: git push origin main" -ForegroundColor Gray
    Write-Host ""
}

# =========================================
# Menu Interactif
# =========================================
function Show-InteractiveMenu {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Menu Configuration Domaine Custom" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Lister les domaines actuels"
    Write-Host "2. Ajouter un nouveau domaine"
    Write-Host "3. Vérifier DNS d'un domaine"
    Write-Host "4. Mettre à jour les variables d'environnement"
    Write-Host "5. Afficher la documentation DNS"
    Write-Host "6. Ouvrir le dashboard Cloudflare"
    Write-Host "0. Quitter"
    Write-Host ""
    
    $choice = Read-Host "Sélectionnez une option"
    
    switch ($choice) {
        "1" {
            Show-CurrentDomains
            Show-InteractiveMenu
        }
        "2" {
            $newDomain = Read-Host "Entrez le domaine (ex: iapostemanager.com ou app.iapostemanager.com)"
            if ($newDomain) {
                Add-CustomDomain -DomainToAdd $newDomain
            } else {
                Write-Host "❌ Domaine invalide" -ForegroundColor Red
            }
            Show-InteractiveMenu
        }
        "3" {
            $checkDomain = Read-Host "Entrez le domaine à vérifier"
            if ($checkDomain) {
                Test-DNSConfiguration -Domain $checkDomain
            }
            Show-InteractiveMenu
        }
        "4" {
            $updateDomain = Read-Host "Entrez le nouveau domaine pour les variables d'env"
            if ($updateDomain) {
                Update-EnvironmentVariables -Domain $updateDomain
            }
            Show-InteractiveMenu
        }
        "5" {
            $docDomain = Read-Host "Entrez le domaine pour voir la config DNS"
            if ($docDomain) {
                Show-DNSRecords -Domain $docDomain
            }
            Show-InteractiveMenu
        }
        "6" {
            Write-Host ""
            Write-Host "🌐 Ouverture du dashboard Cloudflare..." -ForegroundColor Cyan
            Start-Process "https://dash.cloudflare.com/b8fe52a9c1217b3bb71b53c26d0acfab/pages/view/$ProjectName"
            Show-InteractiveMenu
        }
        "0" {
            Write-Host ""
            Write-Host "✓ Au revoir!" -ForegroundColor Green
            Write-Host ""
            exit 0
        }
        default {
            Write-Host "❌ Option invalide" -ForegroundColor Red
            Show-InteractiveMenu
        }
    }
}

# =========================================
# MAIN
# =========================================

# Vérifier l'authentification
Test-WranglerAuth

# Mode liste uniquement
if ($ListOnly) {
    Show-CurrentDomains
    exit 0
}

# Mode vérification DNS
if ($CheckDNS) {
    if (-not $Domain) {
        $Domain = Read-Host "Entrez le domaine à vérifier"
    }
    Test-DNSConfiguration -Domain $Domain
    exit 0
}

# Mode mise à jour variables d'env
if ($UpdateEnvVars) {
    if (-not $Domain) {
        $Domain = Read-Host "Entrez le domaine pour les variables d'env"
    }
    Update-EnvironmentVariables -Domain $Domain
    exit 0
}

# Si domaine fourni en paramètre
if ($Domain) {
    Add-CustomDomain -DomainToAdd $Domain
    Test-DNSConfiguration -Domain $Domain
    
    Write-Host ""
    $updateVars = Read-Host "Voulez-vous mettre à jour les variables d'environnement maintenant? (O/N)"
    if ($updateVars -eq "O" -or $updateVars -eq "o") {
        Update-EnvironmentVariables -Domain $Domain
    }
    
    exit 0
}

# Sinon, menu interactif
Show-InteractiveMenu

Write-Host ""
Write-Host "✓ Script terminé" -ForegroundColor Green
Write-Host ""
