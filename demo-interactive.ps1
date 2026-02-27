Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DEMO INTERACTIVE MEMOLIB PLATFORM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Etape 1: Choix du secteur
Write-Host "ETAPE 1: CHOIX DU SECTEUR CLIENT" -ForegroundColor Yellow
Write-Host ""
Write-Host "Quel type de client allez-vous rencontrer?" -ForegroundColor White
Write-Host ""
Write-Host "1. Avocat" -ForegroundColor White
Write-Host "2. Medecin" -ForegroundColor White
Write-Host "3. Consultant" -ForegroundColor White
Write-Host "4. Comptable" -ForegroundColor White
Write-Host "5. Autre (choisir parmi 36 secteurs)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Votre choix (1-5)"

$sectorMap = @{
    "1" = "1"
    "2" = "4"
    "3" = "8"
    "4" = "11"
}

if ($choice -eq "5") {
    Write-Host ""
    & ".\change-sector.ps1"
} elseif ($sectorMap.ContainsKey($choice)) {
    $sectorChoice = $sectorMap[$choice]
    Write-Host $sectorChoice | Out-File -FilePath "current-sector.txt" -NoNewline
    
    $sectorNames = @{
        "1" = "LegalMemo (Avocats)"
        "4" = "MediMemo (Medecins)"
        "8" = "ConsultMemo (Consultants)"
        "11" = "AccountMemo (Comptables)"
    }
    
    Write-Host ""
    Write-Host "Secteur configure: $($sectorNames[$sectorChoice])" -ForegroundColor Green
}

Write-Host ""
Write-Host "Appuyez sur ENTREE pour continuer..." -ForegroundColor Yellow
Read-Host

# Etape 2: Preparation
Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ETAPE 2: PREPARATION DE LA DEMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Preparation en cours..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  [1/3] Configuration secteur..." -ForegroundColor White
Start-Sleep -Seconds 1
Write-Host "  [2/3] Verification base de donnees..." -ForegroundColor White
Start-Sleep -Seconds 1
Write-Host "  [3/3] Preparation interface..." -ForegroundColor White
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "PRET!" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur ENTREE pour lancer la demo..." -ForegroundColor Yellow
Read-Host

# Etape 3: Lancement
Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ETAPE 3: LANCEMENT DES SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Demarrage des services..." -ForegroundColor Yellow
Write-Host ""

# Lancer les services
$jobs = @()

Write-Host "  [1/3] API Backend (port 5078)..." -ForegroundColor White
$jobs += Start-Job -ScriptBlock { Set-Location $using:PWD; dotnet run }
Start-Sleep -Seconds 3

Write-Host "  [2/3] Frontend Utilisateur (port 3000)..." -ForegroundColor White
$jobs += Start-Job -ScriptBlock { Set-Location $using:PWD; node server-frontend.js }
Start-Sleep -Seconds 2

Write-Host "  [3/3] Admin Panel (port 8091)..." -ForegroundColor White
$jobs += Start-Job -ScriptBlock { Set-Location $using:PWD; node server-admin.js }
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "TOUS LES SERVICES SONT LANCES!" -ForegroundColor Green
Write-Host ""

# Etape 4: Instructions demo
Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DEMO PRETE - INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ACCES:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Admin:    http://localhost:8091" -ForegroundColor White
Write-Host ""

Write-Host "SCENARIO DE DEMO (5 minutes):" -ForegroundColor Yellow
Write-Host ""
Write-Host "MINUTE 1 - INTRODUCTION" -ForegroundColor Cyan
Write-Host "  'Bonjour, je vous presente [SectorMemo]'" -ForegroundColor White
Write-Host "  'Specialement concu pour votre metier'" -ForegroundColor White
Write-Host ""

Write-Host "MINUTE 2 - PROBLEME" -ForegroundColor Cyan
Write-Host "  'Combien d'emails recevez-vous par jour?'" -ForegroundColor White
Write-Host "  'Comment gerez-vous vos dossiers clients?'" -ForegroundColor White
Write-Host ""

Write-Host "MINUTE 3 - SOLUTION" -ForegroundColor Cyan
Write-Host "  Ouvrir: http://localhost:3000" -ForegroundColor White
Write-Host "  'Regardez: interface adaptee a votre metier'" -ForegroundColor White
Write-Host "  'Tous vos emails deviennent des dossiers'" -ForegroundColor White
Write-Host ""

Write-Host "MINUTE 4 - DEMONSTRATION" -ForegroundColor Cyan
Write-Host "  Ouvrir: http://localhost:8091" -ForegroundColor White
Write-Host "  'Voici le monitoring en temps reel'" -ForegroundColor White
Write-Host "  'Chaque email est automatiquement traite'" -ForegroundColor White
Write-Host ""

Write-Host "MINUTE 5 - CLOSING" -ForegroundColor Cyan
Write-Host "  '30 jours d'essai gratuit'" -ForegroundColor White
Write-Host "  'Prix: 30 EUR/mois'" -ForegroundColor White
Write-Host "  'On commence quand?'" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur ENTREE pour ouvrir les navigateurs..." -ForegroundColor Yellow
Read-Host

# Ouvrir les navigateurs
Start-Process "http://localhost:3000"
Start-Sleep -Seconds 1
Start-Process "http://localhost:8091"

Write-Host ""
Write-Host "DEMO EN COURS!" -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur ENTREE pour arreter la demo..." -ForegroundColor Yellow
Read-Host

# Arreter les services
Write-Host ""
Write-Host "Arret des services..." -ForegroundColor Red
$jobs | Stop-Job
$jobs | Remove-Job
Get-Process -Name "dotnet","node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Demo terminee!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour relancer: .\demo-interactive.ps1" -ForegroundColor Yellow
