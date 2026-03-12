# MemoLib - Lanceur de Demo Automatique

Write-Host "MemoLib - Demarrage de la demo complete" -ForegroundColor Cyan
Write-Host ""

# Verifier si l'application tourne
$apiUrl = "http://localhost:5078"
Write-Host "Verification de l'API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$apiUrl/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "API operationnelle" -ForegroundColor Green
} catch {
    Write-Host "API non accessible. Lancez l'application d'abord :" -ForegroundColor Red
    Write-Host "  cd C:\Users\moros\Desktop\memolib\MemoLib.Api" -ForegroundColor White
    Write-Host "  dotnet run" -ForegroundColor White
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter"
    exit
}

Write-Host ""
Write-Host "ORDRE DE LA DEMO :" -ForegroundColor Cyan
Write-Host "  1. Dashboard Professionnel (Vue d'ensemble)" -ForegroundColor White
Write-Host "  2. Timeline Visuelle (Historique dossier)" -ForegroundColor White
Write-Host "  3. Interface Moderne (Design ameliore)" -ForegroundColor White
Write-Host "  4. Interface Complete (Fonctionnalites)" -ForegroundColor White
Write-Host ""

Write-Host "Attente de 3 secondes avant ouverture..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 1. Dashboard Professionnel
Write-Host ""
Write-Host "1. Ouverture du Dashboard Professionnel..." -ForegroundColor Green
Start-Process "$apiUrl/dashboard-pro.html"
Write-Host "   Montrez les graphiques et statistiques" -ForegroundColor Gray
Write-Host "   Duree recommandee : 5 minutes" -ForegroundColor Gray
Write-Host ""
Write-Host "   Appuyez sur Entree pour continuer..." -ForegroundColor Yellow
Read-Host

# 2. Timeline Visuelle
Write-Host ""
Write-Host "2. Ouverture de la Timeline Visuelle..." -ForegroundColor Green
Start-Process "$apiUrl/timeline-demo.html"
Write-Host "   Montrez l'historique complet du dossier" -ForegroundColor Gray
Write-Host "   Utilisez les filtres" -ForegroundColor Gray
Write-Host "   Duree recommandee : 5 minutes" -ForegroundColor Gray
Write-Host ""
Write-Host "   Appuyez sur Entree pour continuer..." -ForegroundColor Yellow
Read-Host

# 3. Interface Moderne
Write-Host ""
Write-Host "3. Ouverture de l'Interface Moderne..." -ForegroundColor Green
Start-Process "$apiUrl/demo-modern.html"
Write-Host "   Montrez le design moderne et les animations" -ForegroundColor Gray
Write-Host "   Testez les notifications toast" -ForegroundColor Gray
Write-Host "   Duree recommandee : 3 minutes" -ForegroundColor Gray
Write-Host ""
Write-Host "   Appuyez sur Entree pour continuer..." -ForegroundColor Yellow
Read-Host

# 4. Interface Complete
Write-Host ""
Write-Host "4. Ouverture de l'Interface Complete..." -ForegroundColor Green
Start-Process "$apiUrl/demo.html"
Write-Host "   Montrez toutes les fonctionnalites" -ForegroundColor Gray
Write-Host "   Scannez les emails en direct" -ForegroundColor Gray
Write-Host "   Creez un dossier" -ForegroundColor Gray
Write-Host "   Montrez le centre d'anomalies" -ForegroundColor Gray
Write-Host "   Duree recommandee : 10 minutes" -ForegroundColor Gray
Write-Host ""

Write-Host ""
Write-Host "Toutes les pages sont ouvertes !" -ForegroundColor Green
Write-Host ""
Write-Host "RAPPEL DES POINTS CLES :" -ForegroundColor Cyan
Write-Host "  - Automatique" -ForegroundColor White
Write-Host "  - Temps reel" -ForegroundColor White
Write-Host "  - 0 euros/mois" -ForegroundColor White
Write-Host "  - Professionnel" -ForegroundColor White
Write-Host "  - Complet" -ForegroundColor White
Write-Host ""
Write-Host "Duree totale recommandee : 20-25 minutes" -ForegroundColor Yellow
Write-Host ""
Write-Host "Bonne demo !" -ForegroundColor Green
Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"
