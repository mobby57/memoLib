# 🌐 TUNNEL HTTPS - MemoLib API
# Expose votre API locale sur Internet via HTTPS

Write-Host "🌐 TUNNEL HTTPS - MemoLib API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si l'API est démarrée
$apiRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5078/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $apiRunning = $true
        Write-Host "✅ API détectée sur http://localhost:5078" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  API non détectée sur http://localhost:5078" -ForegroundColor Yellow
    Write-Host "   Démarrez l'API avec: dotnet run" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "Choisissez votre méthode de tunnel:" -ForegroundColor Cyan
Write-Host "1. ngrok (recommandé - gratuit, simple)" -ForegroundColor White
Write-Host "2. cloudflared (Cloudflare Tunnel - gratuit, rapide)" -ForegroundColor White
Write-Host "3. localtunnel (npm - gratuit, basique)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Votre choix (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Démarrage ngrok..." -ForegroundColor Cyan
        Write-Host ""
        
        # Vérifier si ngrok est installé
        $ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
        
        if (-not $ngrokPath) {
            Write-Host "❌ ngrok n'est pas installé" -ForegroundColor Red
            Write-Host ""
            Write-Host "📥 Installation:" -ForegroundColor Yellow
            Write-Host "1. Téléchargez: https://ngrok.com/download" -ForegroundColor White
            Write-Host "2. Extrayez ngrok.exe dans C:\Windows\System32\" -ForegroundColor White
            Write-Host "3. Créez un compte gratuit: https://dashboard.ngrok.com/signup" -ForegroundColor White
            Write-Host "4. Configurez: ngrok config add-authtoken VOTRE_TOKEN" -ForegroundColor White
            Write-Host ""
            Write-Host "OU via Chocolatey:" -ForegroundColor Yellow
            Write-Host "choco install ngrok" -ForegroundColor White
            exit
        }
        
        Write-Host "✅ ngrok trouvé: $($ngrokPath.Source)" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Création du tunnel HTTPS..." -ForegroundColor Cyan
        Write-Host "   URL locale: http://localhost:5078" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Votre API sera accessible via:" -ForegroundColor Green
        Write-Host "   https://XXXXX.ngrok-free.app" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Appuyez sur Ctrl+C pour arrêter le tunnel" -ForegroundColor Yellow
        Write-Host ""
        
        # Démarrer ngrok
        ngrok http 5078
    }
    
    "2" {
        Write-Host ""
        Write-Host "🚀 Démarrage Cloudflare Tunnel..." -ForegroundColor Cyan
        Write-Host ""
        
        # Vérifier si cloudflared est installé
        $cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
        
        if (-not $cloudflaredPath) {
            Write-Host "❌ cloudflared n'est pas installé" -ForegroundColor Red
            Write-Host ""
            Write-Host "📥 Installation:" -ForegroundColor Yellow
            Write-Host "1. Téléchargez: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor White
            Write-Host "2. Extrayez cloudflared.exe dans C:\Windows\System32\" -ForegroundColor White
            Write-Host ""
            Write-Host "OU via Chocolatey:" -ForegroundColor Yellow
            Write-Host "choco install cloudflared" -ForegroundColor White
            exit
        }
        
        Write-Host "✅ cloudflared trouvé: $($cloudflaredPath.Source)" -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Création du tunnel HTTPS..." -ForegroundColor Cyan
        Write-Host "   URL locale: http://localhost:5078" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Votre API sera accessible via:" -ForegroundColor Green
        Write-Host "   https://XXXXX.trycloudflare.com" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Appuyez sur Ctrl+C pour arrêter le tunnel" -ForegroundColor Yellow
        Write-Host ""
        
        # Démarrer cloudflared
        cloudflared tunnel --url http://localhost:5078
    }
    
    "3" {
        Write-Host ""
        Write-Host "🚀 Démarrage localtunnel..." -ForegroundColor Cyan
        Write-Host ""
        
        # Vérifier si npm est installé
        $npmPath = Get-Command npm -ErrorAction SilentlyContinue
        
        if (-not $npmPath) {
            Write-Host "❌ npm n'est pas installé" -ForegroundColor Red
            Write-Host ""
            Write-Host "📥 Installation:" -ForegroundColor Yellow
            Write-Host "1. Téléchargez Node.js: https://nodejs.org/" -ForegroundColor White
            Write-Host "2. Installez Node.js (inclut npm)" -ForegroundColor White
            exit
        }
        
        Write-Host "✅ npm trouvé" -ForegroundColor Green
        Write-Host ""
        Write-Host "📦 Installation de localtunnel..." -ForegroundColor Cyan
        npm install -g localtunnel
        
        Write-Host ""
        Write-Host "🌐 Création du tunnel HTTPS..." -ForegroundColor Cyan
        Write-Host "   URL locale: http://localhost:5078" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Votre API sera accessible via:" -ForegroundColor Green
        Write-Host "   https://XXXXX.loca.lt" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Appuyez sur Ctrl+C pour arrêter le tunnel" -ForegroundColor Yellow
        Write-Host ""
        
        # Démarrer localtunnel
        npx localtunnel --port 5078
    }
    
    default {
        Write-Host "❌ Choix invalide" -ForegroundColor Red
        exit
    }
}
