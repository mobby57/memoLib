# Cloudflare Quick Tunnel - Version Simple
# Lance un tunnel sans configuration

Write-Host "`nCloudflare Quick Tunnel" -ForegroundColor Cyan
Write-Host "=====================`n" -ForegroundColor Cyan

# Verifier Next.js
$port = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $port) {
    Write-Host "ATTENTION: Next.js ne tourne pas sur port 3000" -ForegroundColor Yellow
    Write-Host "Lancez 'npm run dev' dans un autre terminal`n" -ForegroundColor Yellow
}

Write-Host "Demarrage du tunnel..." -ForegroundColor Green
Write-Host "L'URL apparaitra ci-dessous (.trycloudflare.com)`n" -ForegroundColor Gray

# Lancer cloudflared
.\cloudflared.exe tunnel --url http://localhost:3000 --no-autoupdate
