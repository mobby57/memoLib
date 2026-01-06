# 🚀 Quick Start - Cloudflare Tunnel (sans domaine requis)
# Démarre automatiquement un tunnel avec URL .trycloudflare.com

Write-Host "`n☁️  CLOUDFLARE QUICK TUNNEL" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# Vérifier si cloudflared existe
if (-not (Test-Path "cloudflared.exe")) {
    Write-Host "❌ cloudflared.exe manquant" -ForegroundColor Red
    Write-Host "   Téléchargement..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
    Write-Host "✅ Téléchargé`n" -ForegroundColor Green
}

# Vérifier si Next.js tourne
Write-Host "🔍 Vérification Next.js..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $port3000) {
    Write-Host "⚠️  Next.js ne tourne pas sur le port 3000" -ForegroundColor Yellow
    Write-Host "   Lancer dans un autre terminal: npm run dev`n" -ForegroundColor Gray
    $continue = Read-Host "Continuer quand même? (O/N)"
    if ($continue -ne "O" -and $continue -ne "o") {
        exit
    }
} else {
    Write-Host "✅ Next.js détecté sur port 3000`n" -ForegroundColor Green
}

Write-Host "🌐 Démarrage du tunnel Cloudflare..." -ForegroundColor Cyan
Write-Host "   Cible: http://localhost:3000`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host "⏳ Génération de l'URL publique..." -ForegroundColor Yellow
Write-Host "   (Cela peut prendre 10-15 secondes)" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Green

# Options pour Windows
$env:TUNNEL_TRANSPORT_PROTOCOL = "http2"

# Démarrer le tunnel en mode quick (--no-autoupdate pour éviter les erreurs Windows)
.\cloudflared.exe tunnel --url http://localhost:3000 --no-autoupdate --logfile cloudflare-tunnel.log 2>&1 | ForEach-Object {
    $line = $_.ToString()
    
    # Détecter l'URL générée
    if ($line -match "https://.*\.trycloudflare\.com") {
        $url = $matches[0]
        Write-Host "`n═══════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ TUNNEL ACTIF!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════`n" -ForegroundColor Green
        Write-Host "🌍 URL Publique:" -ForegroundColor Cyan
        Write-Host "   $url`n" -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host "📋 Webhook GitHub:" -ForegroundColor Cyan
        Write-Host "   ${url}/api/webhooks/github`n" -ForegroundColor White
        Write-Host "`n═══════════════════════════════════════" -ForegroundColor Green
        Write-Host "IMPORTANT - Mettez a jour .env:" -ForegroundColor Yellow
        Write-Host "CLOUDFLARE_TUNNEL_URL=`"$url`"" -ForegroundColor White
        Write-Host "PUBLIC_WEBHOOK_URL=`"${url}/api/webhooks/github`"" -ForegroundColor White
        Write-Host "═══════════════════════════════════════`n" -ForegroundColor Green
    }
    
    # Afficher les logs importants
    if ($line -match "ERR|error" -and $line -notmatch "certificate") {
        Write-Host "⚠️  $line" -ForegroundColor Yellow
    }
    elseif ($line -match "INF|Registered tunnel connection") {
        Write-Host "✓ $line" -ForegroundColor Gray
    }
}
