# Demarrage iaPosteManager
Write-Host ' Démarrage iaPosteManager' -ForegroundColor Cyan

# PostgreSQL
Write-Host ' PostgreSQL...' -ForegroundColor Yellow  
docker-compose -f docker-compose.production.yml up -d postgres
Start-Sleep -Seconds 3

# Verification
$pg = docker ps --filter 'name=iaposte_postgres' --filter 'status=running' -q
if ($pg) {
    Write-Host ' PostgreSQL OK' -ForegroundColor Green
} else {
    Write-Host ' PostgreSQL erreur' -ForegroundColor Red
}

Write-Host ''
Write-Host ' Prochaines étapes:' -ForegroundColor Cyan
Write-Host ''
Write-Host '1. Backend (WSL2):' -ForegroundColor White
Write-Host '   wsl bash /mnt/c/Users/moros/Desktop/iaPostemanage/start-backend-wsl.sh' -ForegroundColor Gray
Write-Host ''
Write-Host '2. Frontend (Windows):' -ForegroundColor White
Write-Host '   cd src/frontend' -ForegroundColor Gray
Write-Host '   npm run dev' -ForegroundColor Gray
Write-Host ''
Write-Host ' PostgreSQL prêt - Voir DEMARRAGE_WSL2.md' -ForegroundColor Green