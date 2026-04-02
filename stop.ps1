# 🛑 STOP - API + Tunnel HTTPS

Write-Host "🛑 Arrêt MemoLib + Tunnel" -ForegroundColor Red
Write-Host ""

# Arrêter les processus dotnet
Write-Host "📡 Arrêt de l'API..." -ForegroundColor Yellow
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*MemoLib*" } | Stop-Process -Force
Get-Process -Name "MemoLib.Api" -ErrorAction SilentlyContinue | Stop-Process -Force

# Arrêter ngrok
Write-Host "🌐 Arrêt de ngrok..." -ForegroundColor Yellow
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force

# Arrêter cloudflared
Write-Host "🌐 Arrêt de cloudflared..." -ForegroundColor Yellow
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force

# Libérer les ports
Write-Host "🔓 Libération des ports..." -ForegroundColor Yellow
$ports = @(5078, 7009, 4040)
foreach ($port in $ports) {
    $connections = netstat -ano | findstr ":$port"
    if ($connections) {
        $connections | ForEach-Object {
            if ($_ -match '\s+(\d+)$') {
                $pid = $matches[1]
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                } catch {}
            }
        }
    }
}

Write-Host ""
Write-Host "✅ Tout est arrêté" -ForegroundColor Green
