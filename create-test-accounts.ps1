$API_URL = "http://localhost:5078"

Write-Host "CREATION COMPTES DE TEST" -ForegroundColor Cyan
Write-Host ""

$email = "sarraboudjellal57@gmail.com"
$password = "Sarra123!"

$sectors = @(
    @{id="legal"; name="LegalMemo"},
    @{id="medical"; name="MediMemo"},
    @{id="consulting"; name="ConsultMemo"},
    @{id="accounting"; name="AccountMemo"},
    @{id="architecture"; name="ArchMemo"},
    @{id="realty"; name="RealtyMemo"},
    @{id="insurance"; name="InsureMemo"},
    @{id="engineering"; name="EngineerMemo"}
)

Write-Host "Creation compte unique pour tous les secteurs..." -ForegroundColor Yellow

$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  OK: $email" -ForegroundColor Green
} catch {
    Write-Host "  Compte existe deja" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "COMPTES DE TEST CREES!" -ForegroundColor Green
Write-Host ""
Write-Host "IDENTIFIANTS UNIVERSELS:" -ForegroundColor Cyan
Write-Host "  Email:    $email" -ForegroundColor White
Write-Host "  Password: $password" -ForegroundColor White
Write-Host ""
Write-Host "ACCES A TOUS LES SECTEURS:" -ForegroundColor Cyan
foreach ($sector in $sectors) {
    Write-Host "  - $($sector.name)" -ForegroundColor White
}
