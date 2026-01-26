# Script d'Installation Cloudflare Tunnel
# Usage: .\setup-cloudflare.ps1

Write-Output ""
Write-Output "========================================"
Write-Output "   CONFIGURATION CLOUDFLARE TUNNEL"
Write-Output "========================================"
Write-Output ""

# 1. Verifier cloudflared.exe
if (Test-Path "cloudflared.exe") {
    Write-Output "[OK] cloudflared.exe trouve"
} else {
    Write-Output "[INFO] cloudflared.exe manquant. Telechargement..."
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
    Write-Output "[OK] Telechargement termine"
}

# 2. Tester cloudflared
Write-Output ""
Write-Output "[INFO] Version:"
.\cloudflared.exe --version

# 3. Instructions interactives
Write-Output ""
Write-Output "========================================"
Write-Output "   ETAPES DE CONFIGURATION"
Write-Output "========================================"
Write-Output ""

Write-Output "ETAPE 1: Authentification Cloudflare"
Write-Output "   Commande: .\cloudflared.exe tunnel login"
Write-Output "   -> Une page web va s'ouvrir pour vous connecter"
Write-Output ""

Write-Output "ETAPE 2: Creer un tunnel"
Write-Output "   Commande: .\cloudflared.exe tunnel create iapostemanage"
Write-Output "   -> Notez l'UUID genere"
Write-Output ""

Write-Output "ETAPE 3: Configurer DNS (optionnel)"
Write-Output "   Commande: .\cloudflared.exe tunnel route dns iapostemanage iaposte.votredomaine.com"
Write-Output "   -> Remplacer 'votredomaine.com' par votre domaine"
Write-Output ""

Write-Output "ETAPE 4: Creer config.yml"
Write-Output "   Fichier: $env:USERPROFILE\.cloudflared\config.yml"
Write-Output ""
Write-Output "   Contenu:"
Write-Output "   tunnel: iapostemanage"
Write-Output "   credentials-file: $env:USERPROFILE\.cloudflared\<TUNNEL-UUID>.json"
Write-Output ""
Write-Output "   ingress:"
Write-Output "     - hostname: iaposte.votredomaine.com"
Write-Output "       service: http://localhost:3000"
Write-Output "     - service: http_status:404"

Write-Output ""
Write-Output "========================================"
Write-Output "   DEMARRAGE RAPIDE (sans domaine)"
Write-Output "========================================"
Write-Output ""

Write-Output "Si vous n'avez pas de domaine, utilisez le mode Quick Tunnel:"
Write-Output "   Commande: .\cloudflared.exe tunnel --url http://localhost:3000"
Write-Output ""
Write-Output "[OK] Configuration terminee. Suivez les etapes ci-dessus."
