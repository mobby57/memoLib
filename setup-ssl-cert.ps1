# Installation certificat SSL developpement

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALLATION CERTIFICAT SSL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$existing = dotnet dev-certs https --check --trust 2>&1

if ($existing -match "valid certificate") {
    Write-Host "Certificat SSL deja installe et valide" -ForegroundColor Green
} else {
    Write-Host "Installation du certificat SSL..." -ForegroundColor Yellow
    dotnet dev-certs https --clean
    dotnet dev-certs https --trust
    Write-Host "Certificat SSL installe avec succes" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vous pouvez utiliser HTTPS:" -ForegroundColor White
Write-Host "  https://localhost:5078" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

pause
