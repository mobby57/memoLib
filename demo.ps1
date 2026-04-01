Write-Host "DEMO MEMOLIB - CHOIX SECTEUR" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Choisissez un secteur pour la demo:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Legal      - Avocats (sarraboudjellal57+legal@gmail.com)" -ForegroundColor White
Write-Host "2. Medical    - Medecins (sarraboudjellal57+medical@gmail.com)" -ForegroundColor White
Write-Host "3. Consulting - Consultants (sarraboudjellal57+consulting@gmail.com)" -ForegroundColor White
Write-Host "4. Accounting - Comptables (sarraboudjellal57+accounting@gmail.com)" -ForegroundColor White
Write-Host "5. Architecture - Architectes (sarraboudjellal57+architecture@gmail.com)" -ForegroundColor White
Write-Host "6. Realty     - Agents immo (sarraboudjellal57+realty@gmail.com)" -ForegroundColor White
Write-Host "7. Insurance  - Assureurs (sarraboudjellal57+insurance@gmail.com)" -ForegroundColor White
Write-Host "8. Engineering - Ingenieurs (sarraboudjellal57+engineering@gmail.com)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Votre choix (1-8)"

$sectors = @{
    "1" = @{name="Legal"; email="sarraboudjellal57+legal@gmail.com"; icon="⚖️"}
    "2" = @{name="Medical"; email="sarraboudjellal57+medical@gmail.com"; icon="⚕️"}
    "3" = @{name="Consulting"; email="sarraboudjellal57+consulting@gmail.com"; icon="💼"}
    "4" = @{name="Accounting"; email="sarraboudjellal57+accounting@gmail.com"; icon="📊"}
    "5" = @{name="Architecture"; email="sarraboudjellal57+architecture@gmail.com"; icon="🏗️"}
    "6" = @{name="Realty"; email="sarraboudjellal57+realty@gmail.com"; icon="🏠"}
    "7" = @{name="Insurance"; email="sarraboudjellal57+insurance@gmail.com"; icon="💰"}
    "8" = @{name="Engineering"; email="sarraboudjellal57+engineering@gmail.com"; icon="🔧"}
}

if (-not $sectors.ContainsKey($choice)) {
    Write-Host "Choix invalide!" -ForegroundColor Red
    exit 1
}

$sector = $sectors[$choice]

Write-Host ""
Write-Host "SECTEUR SELECTIONNE: $($sector.icon) $($sector.name)" -ForegroundColor Green
Write-Host "Email de monitoring: $($sector.email)" -ForegroundColor White
Write-Host ""

Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Envoyez un email de test a: $($sector.email)" -ForegroundColor White
Write-Host "2. L'API va le detecter automatiquement" -ForegroundColor White
Write-Host "3. Un dossier sera cree dans le secteur $($sector.name)" -ForegroundColor White
Write-Host ""

Write-Host "Lancement de l'API..." -ForegroundColor Yellow
Write-Host ""

# Lancer l'API
.\start.ps1
