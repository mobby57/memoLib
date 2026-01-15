# Verification Complete de la Migration Cloudflare
# Ce script verifie que ngrok est bien arrete et que Cloudflare est configure

Write-Host "Verification Migration ngrok -> Cloudflare" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

# 1. Verifier si ngrok est encore actif
Write-Host "1. Verification processus ngrok..." -ForegroundColor Yellow
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue

if ($ngrokProcess) {
    Write-Host "   X ngrok est encore actif !" -ForegroundColor Red
    Write-Host "   Pour l'arreter : Stop-Process -Name 'ngrok' -Force" -ForegroundColor Yellow
} else {
    Write-Host "   OK ngrok n'est pas actif" -ForegroundColor Green
}
Write-Host ""

# 2. Verifier si Cloudflare Tunnel est actif
Write-Host "2. Verification Cloudflare Tunnel..." -ForegroundColor Yellow
$cloudflaredProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue

if ($cloudflaredProcess) {
    Write-Host "   OK Cloudflare Tunnel est actif" -ForegroundColor Green
} else {
    Write-Host "   ! Cloudflare Tunnel n'est pas actif" -ForegroundColor Yellow
    Write-Host "   Pour le demarrer : .\cloudflare-start.ps1" -ForegroundColor Cyan
}
Write-Host ""

# 3. Verifier le fichier .env
Write-Host "3. Verification configuration .env..." -ForegroundColor Yellow
$cloudflareUrl = ""
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    # Verifier CLOUDFLARE_TUNNEL_URL
    if ($envContent -match 'CLOUDFLARE_TUNNEL_URL="([^"]+)"') {
        $cloudflareUrl = $Matches[1]
        Write-Host "   OK CLOUDFLARE_TUNNEL_URL configure : $cloudflareUrl" -ForegroundColor Green
    } else {
        Write-Host "   X CLOUDFLARE_TUNNEL_URL non trouve dans .env" -ForegroundColor Red
    }
    
    # Verifier que ngrok est commente
    if ($envContent -match '^#\s*NGROK_URL') {
        Write-Host "   OK NGROK_URL est bien commente" -ForegroundColor Green
    } elseif ($envContent -match '^NGROK_URL=') {
        Write-Host "   ! NGROK_URL n'est pas commente - devrait etre desactive" -ForegroundColor Yellow
    } else {
        Write-Host "   i NGROK_URL non present dans .env" -ForegroundColor Cyan
    }
    
    # Verifier PUBLIC_WEBHOOK_URL
    if ($envContent -match 'PUBLIC_WEBHOOK_URL="([^"]+)"') {
        $webhookUrl = $Matches[1]
        if ($webhookUrl -match "cloudflare") {
            Write-Host "   OK PUBLIC_WEBHOOK_URL utilise Cloudflare" -ForegroundColor Green
        } elseif ($webhookUrl -match "ngrok") {
            Write-Host "   X PUBLIC_WEBHOOK_URL utilise encore ngrok !" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   X Fichier .env non trouve" -ForegroundColor Red
}
Write-Host ""

# 4. Test de connectivite Cloudflare
Write-Host "4. Test connexion Cloudflare Tunnel..." -ForegroundColor Yellow
if ($cloudflareUrl) {
    try {
        $response = Invoke-WebRequest -Uri "$cloudflareUrl/api/webhooks/github" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   OK Cloudflare Tunnel repond correctement (200 OK)" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ! Cloudflare Tunnel ne repond pas" -ForegroundColor Yellow
        Write-Host "   Verifiez que Cloudflare et Next.js sont demarres" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ! Pas d'URL Cloudflare a tester" -ForegroundColor Yellow
}
Write-Host ""

# 5. Resume des actions GitHub
Write-Host ("-" * 60) -ForegroundColor Cyan
Write-Host "ACTIONS A FAIRE SUR GITHUB" -ForegroundColor Cyan
Write-Host ("-" * 60) -ForegroundColor Cyan
Write-Host ""
Write-Host "Webhooks : https://github.com/mobby57/iapostemanager/settings/hooks" -ForegroundColor White
Write-Host "   -> Modifier Payload URL vers : $cloudflareUrl/api/webhooks/github" -ForegroundColor Yellow
Write-Host ""
Write-Host "Secrets : https://github.com/mobby57/iapostemanager/settings/secrets/actions" -ForegroundColor White
Write-Host "   -> Ajouter GITHUB_WEBHOOK_SECRET" -ForegroundColor Yellow
Write-Host ""
Write-Host "Variables : https://github.com/mobby57/iapostemanager/settings/variables/actions" -ForegroundColor White
Write-Host "   -> Ajouter CLOUDFLARE_TUNNEL_URL" -ForegroundColor Yellow
Write-Host "   -> Ajouter WEBHOOK_URL" -ForegroundColor Yellow
Write-Host "   -> Ajouter PUBLIC_WEBHOOK_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host ("-" * 60) -ForegroundColor Cyan
Write-Host "Documentation complete : CLOUDFLARE_GITHUB_ACTIONS.md" -ForegroundColor Cyan
Write-Host ("-" * 60) -ForegroundColor Cyan
Write-Host ""

# 6. Afficher les valeurs a utiliser
Write-Host "VALEURS A COPIER/COLLER" -ForegroundColor Green
Write-Host ("-" * 60) -ForegroundColor Green
if ($cloudflareUrl) {
    Write-Host "Webhook URL :"
    Write-Host "  $cloudflareUrl/api/webhooks/github" -ForegroundColor Cyan
}
if ($envContent -match 'GITHUB_WEBHOOK_SECRET="([^"]+)"') {
    $webhookSecret = $Matches[1]
    Write-Host "`nWebhook Secret :"
    Write-Host "  $webhookSecret" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "OK Verification terminee !" -ForegroundColor Green
