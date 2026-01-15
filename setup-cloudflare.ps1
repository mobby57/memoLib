# 🚀 Script d'Installation Cloudflare Tunnel
# Usage: .\setup-cloudflare.ps1

Write-Host "`n☁️  CONFIGURATION CLOUDFLARE TUNNEL" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# 1. Vérifier cloudflared.exe
if (Test-Path "cloudflared.exe") {
    Write-Host "✅ cloudflared.exe trouvé" -ForegroundColor Green
} else {
    Write-Host "❌ cloudflared.exe manquant. Téléchargement..." -ForegroundColor Red
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
    Write-Host "✅ Téléchargement terminé" -ForegroundColor Green
}

# 2. Tester cloudflared
Write-Host "`n📋 Version:" -ForegroundColor Yellow
.\cloudflared.exe --version

# 3. Instructions interactives
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📝 ÉTAPES DE CONFIGURATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "ÉTAPE 1: Authentification Cloudflare" -ForegroundColor Yellow
Write-Host "   Commande: " -NoNewline
Write-Host ".\cloudflared.exe tunnel login" -ForegroundColor White
Write-Host "   → Une page web va s'ouvrir pour vous connecter`n" -ForegroundColor Gray

Write-Host "ÉTAPE 2: Créer un tunnel" -ForegroundColor Yellow
Write-Host "   Commande: " -NoNewline
Write-Host ".\cloudflared.exe tunnel create iapostemanage" -ForegroundColor White
Write-Host "   → Notez l'UUID généré`n" -ForegroundColor Gray

Write-Host "ÉTAPE 3: Configurer DNS (optionnel)" -ForegroundColor Yellow
Write-Host "   Commande: " -NoNewline
Write-Host ".\cloudflared.exe tunnel route dns iapostemanage iaposte.votredomaine.com" -ForegroundColor White
Write-Host "   → Remplacer 'votredomaine.com' par votre domaine`n" -ForegroundColor Gray

Write-Host "ÉTAPE 4: Créer config.yml" -ForegroundColor Yellow
Write-Host "   Fichier: " -NoNewline
Write-Host "$env:USERPROFILE\.cloudflared\config.yml" -ForegroundColor White
Write-Host @"
   Contenu:
   tunnel: iapostemanage
   credentials-file: $env:USERPROFILE\.cloudflared\<TUNNEL-UUID>.json

   ingress:
     - hostname: iaposte.votredomaine.com
       service: http://localhost:3000
     - service: http_status:404
"@ -ForegroundColor Gray

Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 DÉMARRAGE RAPIDE (sans domaine)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Si vous n'avez pas de domaine, utilisez le mode Quick Tunnel:" -ForegroundColor White
Write-Host "   Commande: " -NoNewline
Write-Host ".\cloudflared.exe tunnel --url http://localhost:3000" -ForegroundColor Green
Write-Host "   → URL automatique fournie (.trycloudflare.com)`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

$response = Read-Host "Voulez-vous démarrer l'authentification maintenant? (O/N)"
if ($response -eq "O" -or $response -eq "o") {
    Write-Host "`n🔐 Lancement de l'authentification..." -ForegroundColor Cyan
    .\cloudflared.exe tunnel login
}
