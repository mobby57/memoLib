# 🚀 Démarrage Complet - iaPostemanage avec Cloudflare Tunnel
# Lance Next.js + Cloudflare Tunnel + Email Monitor

param(
    [switch]$NoTunnel,
    [switch]$NoEmail,
    [switch]$EmailOnly
)

Write-Host "`n🚀 IA POSTE MANAGER - DÉMARRAGE COMPLET" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Fonction pour démarrer un process en arrière-plan
function Start-BackgroundProcess {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Args
    )
    
    Write-Host "🔄 Démarrage: $Name..." -ForegroundColor Yellow
    
    if ($Args) {
        $process = Start-Process -FilePath $Command -ArgumentList $Args -PassThru -NoNewWindow
    } else {
        $process = Start-Process -FilePath $Command -PassThru -NoNewWindow
    }
    
    if ($process) {
        Write-Host "✅ $Name démarré (PID: $($process.Id))" -ForegroundColor Green
        return $process
    } else {
        Write-Host "❌ Erreur démarrage $Name" -ForegroundColor Red
        return $null
    }
}

$processes = @()

# 1. Démarrer Next.js (sauf si EmailOnly)
if (-not $EmailOnly) {
    Write-Host "`n[1/3] 🌐 Next.js Dev Server" -ForegroundColor Cyan
    Write-Host "─────────────────────────────" -ForegroundColor Gray
    
    # Vérifier si déjà en cours
    $existingNext = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($existingNext) {
        Write-Host "⚠️  Port 3000 déjà utilisé" -ForegroundColor Yellow
        Write-Host "   Next.js semble déjà tourner`n" -ForegroundColor Gray
    } else {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
        Start-Sleep -Seconds 5
        Write-Host "✅ Next.js démarré sur http://localhost:3000`n" -ForegroundColor Green
    }
}

# 2. Démarrer Cloudflare Tunnel (sauf si NoTunnel ou EmailOnly)
if (-not $NoTunnel -and -not $EmailOnly) {
    Write-Host "[2/3] ☁️  Cloudflare Tunnel" -ForegroundColor Cyan
    Write-Host "─────────────────────────────" -ForegroundColor Gray
    
    if (Test-Path "cloudflared.exe") {
        Write-Host "🌐 Démarrage du tunnel Quick (URL automatique)..." -ForegroundColor Yellow
        Write-Host "   Attendez l'URL .trycloudflare.com...`n" -ForegroundColor Gray
        
        Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\cloudflared.exe tunnel --url http://localhost:3000"
        Start-Sleep -Seconds 3
        
        Write-Host "📋 L'URL du tunnel s'affiche dans la fenêtre Cloudflare" -ForegroundColor Cyan
        Write-Host "   Format: https://xxx-xxx-xxx.trycloudflare.com`n" -ForegroundColor Gray
        Write-Host "⚠️  IMPORTANT: Copiez cette URL et mettez à jour .env:" -ForegroundColor Yellow
        Write-Host "   CLOUDFLARE_TUNNEL_URL=`"https://xxx.trycloudflare.com`"" -ForegroundColor White
        Write-Host "   PUBLIC_WEBHOOK_URL=`"https://xxx.trycloudflare.com/api/webhooks/github`"`n" -ForegroundColor White
    } else {
        Write-Host "❌ cloudflared.exe non trouvé" -ForegroundColor Red
        Write-Host "   Lancer: .\setup-cloudflare.ps1`n" -ForegroundColor Yellow
    }
}

# 3. Démarrer Email Monitor (sauf si NoEmail)
if (-not $NoEmail) {
    Write-Host "[3/3] 📧 Email Monitor" -ForegroundColor Cyan
    Write-Host "─────────────────────────────" -ForegroundColor Gray
    
    $choice = Read-Host "Démarrer le monitoring email? (O/N)"
    if ($choice -eq "O" -or $choice -eq "o") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run email:monitor:integrated"
        Start-Sleep -Seconds 2
        Write-Host "✅ Email Monitor démarré`n" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Email Monitor ignoré`n" -ForegroundColor Gray
    }
}

# Résumé
Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ SYSTÈME DÉMARRÉ" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

if (-not $EmailOnly) {
    Write-Host "🌐 Application:" -ForegroundColor Yellow
    Write-Host "   Local:  http://localhost:3000" -ForegroundColor White
    if (-not $NoTunnel) {
        Write-Host "   Public: Voir fenêtre Cloudflare (.trycloudflare.com)" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host "📊 Services actifs:" -ForegroundColor Yellow
$services = @()
if (-not $EmailOnly) { $services += "Next.js (port 3000)" }
if (-not $NoTunnel -and -not $EmailOnly) { $services += "Cloudflare Tunnel" }
if (-not $NoEmail) { $services += "Email Monitor" }
foreach ($service in $services) {
    Write-Host "   + $service" -ForegroundColor White
}

Write-Host "`n📋 Liens utiles:" -ForegroundColor Yellow
if (-not $EmailOnly) {
    Write-Host "   Dashboard: http://localhost:3000/lawyer/emails" -ForegroundColor White
    Write-Host "   Prisma:    http://localhost:5555" -ForegroundColor White
}
Write-Host "   Cloudflare Dashboard: https://one.dash.cloudflare.com/" -ForegroundColor White

Write-Host "`n⚠️  Pour arrêter tous les services:" -ForegroundColor Yellow
Write-Host "   Fermez toutes les fenêtres PowerShell ouvertes" -ForegroundColor Gray
Write-Host "   OU utilisez: Get-Process node,cloudflared | Stop-Process`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan
