# =========================================
# Configuration Domaine Custom - Cloudflare Pages
# =========================================
# Script pour ajouter et configurer un domaine personnalise
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

Write-Output ""
Write-Output "====================================="
Write-Output "  Cloudflare Pages - Custom Domain"
Write-Output "====================================="
Write-Output ""

# =========================================
# Fonction: Afficher les domaines actuels
# =========================================
function Show-CurrentDomains {
    Write-Output "[INFO] Domaines configures actuellement:"
    Write-Output ""
    
    try {
        wrangler pages domain list --project-name $ProjectName
    } catch {
        Write-Output "[ERREUR] Erreur lors de la recuperation des domaines"
        Write-Output $_.Exception.Message
        exit 1
    }
}

# =========================================
# Fonction: Verifier la connexion Wrangler
# =========================================
function Test-WranglerAuth {
    Write-Output "[INFO] Verification de l'authentification Wrangler..."
    
    try {
        $projects = wrangler pages project list 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Output "[ERREUR] Non authentifie. Executez: wrangler login"
            exit 1
        }
        Write-Output "[OK] Authentifie avec succes"
    } catch {
        Write-Output "[ERREUR] Erreur d'authentification"
        exit 1
    }
}

# =========================================
# Fonction: Ajouter un domaine custom
# =========================================
function Add-CustomDomain {
    param([string]$DomainToAdd)
    
    Write-Output ""
    Write-Output "[INFO] Ajout du domaine: $DomainToAdd"
    Write-Output ""
    
    try {
        wrangler pages domain add $DomainToAdd --project-name $ProjectName
        
        Write-Output ""
        Write-Output "[OK] Domaine ajoute avec succes!"
        Write-Output ""
        Write-Output "=== CONFIGURATION DNS REQUISE ==="
        Write-Output ""
        Write-Output "Ajoutez ces enregistrements DNS chez votre registrar:"
        Write-Output ""
        Write-Output "Type: CNAME"
        Write-Output "Nom:  $DomainToAdd"
        Write-Output "Cible: $ProjectName.pages.dev"
        Write-Output ""
        Write-Output "OU pour un apex domain (sans www):"
        Write-Output ""
        Write-Output "Type: CNAME (ou ALIAS/ANAME si supporte)"
        Write-Output "Nom:  @"
        Write-Output "Cible: $ProjectName.pages.dev"
        Write-Output ""
        
    } catch {
        Write-Output "[ERREUR] Erreur lors de l'ajout du domaine"
        Write-Output $_.Exception.Message
    }
}

# =========================================
# Fonction: Verifier DNS
# =========================================
function Test-DomainDNS {
    param([string]$DomainToCheck)
    
    Write-Output ""
    Write-Output "[INFO] Verification DNS pour: $DomainToCheck"
    Write-Output ""
    
    try {
        $dnsResult = Resolve-DnsName -Name $DomainToCheck -Type CNAME -ErrorAction SilentlyContinue
        
        if ($dnsResult) {
            Write-Output "[OK] DNS configure:"
            Write-Output "  Type:  CNAME"
            Write-Output "  Cible: $($dnsResult.NameHost)"
            
            if ($dnsResult.NameHost -like "*pages.dev") {
                Write-Output "[OK] Pointe vers Cloudflare Pages"
            } else {
                Write-Output "[WARN] Ne pointe pas vers pages.dev"
            }
        } else {
            # Essayer A record
            $aRecord = Resolve-DnsName -Name $DomainToCheck -Type A -ErrorAction SilentlyContinue
            if ($aRecord) {
                Write-Output "[INFO] Enregistrement A trouve:"
                Write-Output "  IP: $($aRecord.IPAddress)"
            } else {
                Write-Output "[WARN] Aucun enregistrement DNS trouve"
            }
        }
    } catch {
        Write-Output "[WARN] Impossible de resoudre le DNS"
    }
}

# =========================================
# Fonction: Mettre a jour variables d'env
# =========================================
function Update-EnvironmentVariables {
    param([string]$NewDomain)
    
    Write-Output ""
    Write-Output "[INFO] Mise a jour des variables d'environnement..."
    Write-Output ""
    
    # Mettre a jour NEXT_PUBLIC_APP_URL
    $appUrl = "https://$NewDomain"
    
    try {
        Write-Output "[INFO] Setting NEXT_PUBLIC_APP_URL=$appUrl"
        wrangler pages secret put NEXT_PUBLIC_APP_URL --project-name $ProjectName
        
        Write-Output "[INFO] Setting NEXTAUTH_URL=$appUrl"
        wrangler pages secret put NEXTAUTH_URL --project-name $ProjectName
        
        Write-Output ""
        Write-Output "[OK] Variables mises a jour!"
        
    } catch {
        Write-Output "[WARN] Certaines variables n'ont pas ete mises a jour"
    }
}

# =========================================
# MAIN
# =========================================

# Verifier authentification
Test-WranglerAuth

# Mode ListOnly
if ($ListOnly) {
    Show-CurrentDomains
    exit 0
}

# Mode CheckDNS
if ($CheckDNS -and $Domain) {
    Test-DomainDNS -DomainToCheck $Domain
    exit 0
}

# Mode UpdateEnvVars
if ($UpdateEnvVars -and $Domain) {
    Update-EnvironmentVariables -NewDomain $Domain
    exit 0
}

# Mode interactif si pas de domaine specifie
if ([string]::IsNullOrEmpty($Domain)) {
    Write-Output "Utilisation:"
    Write-Output "  .\cloudflare-custom-domain.ps1 -Domain 'example.com'"
    Write-Output "  .\cloudflare-custom-domain.ps1 -ListOnly"
    Write-Output "  .\cloudflare-custom-domain.ps1 -Domain 'example.com' -CheckDNS"
    Write-Output "  .\cloudflare-custom-domain.ps1 -Domain 'example.com' -UpdateEnvVars"
    Write-Output ""
    
    Show-CurrentDomains
    
    Write-Output ""
    $Domain = Read-Host "Entrez le domaine a ajouter (ou Entree pour quitter)"
    
    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Output "Annule."
        exit 0
    }
}

# Ajouter le domaine
Add-CustomDomain -DomainToAdd $Domain

# Proposer de verifier DNS
Write-Output ""
$checkDns = Read-Host "Voulez-vous verifier le DNS maintenant? (o/N)"
if ($checkDns -eq "o" -or $checkDns -eq "O") {
    Test-DomainDNS -DomainToCheck $Domain
}

# Proposer de mettre a jour les variables
Write-Output ""
$updateVars = Read-Host "Mettre a jour les variables d'environnement? (o/N)"
if ($updateVars -eq "o" -or $updateVars -eq "O") {
    Update-EnvironmentVariables -NewDomain $Domain
}

Write-Output ""
Write-Output "[OK] Configuration terminee!"
Write-Output ""
