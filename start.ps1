# 🚀 START - API + Tunnel HTTPS
param(
    [string]$Method = "ngrok"
)

Write-Host "🚀 Démarrage MemoLib + Tunnel HTTPS" -ForegroundColor Cyan
Write-Host ""

# Démarrer l'API en arrière-plan
Write-Host "📡 Démarrage de l'API..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\moros\Desktop\memolib\MemoLib.Api"
    dotnet run
}

# Attendre que l'API démarre
Write-Host "⏳ Attente du démarrage de l'API..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$apiReady = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5078/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $apiReady = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $apiReady) {
    Write-Host "❌ L'API n'a pas démarré" -ForegroundColor Red
    Stop-Job $apiJob
    Remove-Job $apiJob
    exit
}

Write-Host "✅ API démarrée sur http://localhost:5078" -ForegroundColor Green
Write-Host ""

# Démarrer le tunnel
Write-Host "🌐 Démarrage du tunnel $Method..." -ForegroundColor Yellow
Write-Host ""

switch ($Method) {
    "ngrok" {
        if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
            Write-Host "❌ ngrok non installé: choco install ngrok" -ForegroundColor Red
            Stop-Job $apiJob
            Remove-Job $apiJob
            exit
        }
        ngrok http 5078
    }
    "cloudflared" {
        if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
            Write-Host "❌ cloudflared non installé: choco install cloudflared" -ForegroundColor Red
            Stop-Job $apiJob
            Remove-Job $apiJob
            exit
        }
        cloudflared tunnel --url http://localhost:5078
    }
    default {
        Write-Host "❌ Méthode invalide. Utilisez: ngrok ou cloudflared" -ForegroundColor Red
        Stop-Job $apiJob
        Remove-Job $apiJob
        exit
    }
}

# Nettoyage à l'arrêt
Write-Host ""
Write-Host "🛑 Arrêt de l'API..." -ForegroundColor Yellow
Stop-Job $apiJob
Remove-Job $apiJob
Write-Host "✅ Arrêté" -ForegroundColor Green
