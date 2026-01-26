# Quick Start - Cloudflare Tunnel (sans domaine requis)
# Demarre automatiquement un tunnel avec URL .trycloudflare.com

Write-Output ""
Write-Output "========================================"
Write-Output "   CLOUDFLARE QUICK TUNNEL"
Write-Output "========================================"
Write-Output ""

# Verifier si cloudflared existe
if (-not (Test-Path "cloudflared.exe")) {
    Write-Output "[WARN] cloudflared.exe manquant"
    Write-Output "   Telechargement..."
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
    Write-Output "[OK] Telecharge"
    Write-Output ""
}

# Verifier si Next.js tourne
Write-Output "[INFO] Verification Next.js..."
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $port3000) {
    Write-Output "[WARN] Next.js ne tourne pas sur le port 3000"
    Write-Output "   Lancer dans un autre terminal: npm run dev"
    Write-Output ""
    $continue = Read-Host "Continuer quand meme? (O/N)"
    if ($continue -ne "O" -and $continue -ne "o") {
        exit
    }
} else {
    Write-Output "[OK] Next.js detecte sur port 3000"
    Write-Output ""
}

Write-Output "[INFO] Demarrage du tunnel Cloudflare..."
Write-Output "   Cible: http://localhost:3000"
Write-Output ""

Write-Output "========================================"
Write-Output "[WAIT] Generation de l'URL publique..."
Write-Output "   (Cela peut prendre 10-15 secondes)"
Write-Output "========================================"
Write-Output ""

# Options pour Windows
$env:TUNNEL_TRANSPORT_PROTOCOL = "http2"

# Demarrer le tunnel en mode quick
.\cloudflared.exe tunnel --url http://localhost:3000 --no-autoupdate --logfile cloudflare-tunnel.log 2>&1 | ForEach-Object {
    $line = $_.ToString()
    
    # Detecter l'URL generee
    if ($line -match "https://.*\.trycloudflare\.com") {
        $url = $matches[0]
        Write-Output ""
        Write-Output "========================================"
        Write-Output "[OK] TUNNEL ACTIF!"
        Write-Output "========================================"
        Write-Output ""
        Write-Output "[URL] URL Publique:"
        Write-Output "   $url"
        Write-Output ""
        Write-Output "[WEBHOOK] Webhook GitHub:"
        Write-Output "   ${url}/api/webhooks/github"
        Write-Output ""
        Write-Output "========================================"
        Write-Output "IMPORTANT - Mettez a jour .env:"
        Write-Output "CLOUDFLARE_TUNNEL_URL=`"$url`""
        Write-Output "PUBLIC_WEBHOOK_URL=`"${url}/api/webhooks/github`""
        Write-Output "========================================"
        Write-Output ""
    }
    
    # Afficher les logs
    Write-Output $line
}
