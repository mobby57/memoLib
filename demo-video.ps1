#!/usr/bin/env powershell
<#
.SYNOPSIS
    Démonstration vidéo interactive de MemoLib

.DESCRIPTION
    Lance Playwright en mode UI pour montrer visuellement le login et le dashboard

.EXAMPLE
    .\demo-video.ps1

.NOTES
    - Nécessite Next.js en cours d'exécution sur http://localhost:3000
    - Lance Playwright en mode interface graphique
    - Parfait pour les démonstrations clients
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseURL = "http://localhost:3000"
)

# Couleurs
$info = "Cyan"
$success = "Green"
$warning = "Yellow"

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        🎥 DÉMONSTRATION VIDÉO INTERACTIVE - MEMOLIB 🎥        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

" -ForegroundColor $info

Write-Host "📋 Prérequis:" -ForegroundColor $info
Write-Host "   ✅ Next.js doit être démarré sur $BaseURL" -ForegroundColor White
Write-Host "   ✅ Identifiants: avocat@memolib.fr / admin123`n" -ForegroundColor White

Write-Host "⏳ Vérification du serveur Next.js..." -ForegroundColor $info

try {
    $response = Invoke-WebRequest -Uri "$BaseURL/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 503) {
        Write-Host "   ✅ Serveur Next.js détecté!`n" -ForegroundColor $success
    }
} catch {
    Write-Host "   ⚠️ Serveur Next.js non accessible" -ForegroundColor $warning
    Write-Host "   💡 Démarrez-le avec: cd src/frontend && npm run dev`n" -ForegroundColor $warning

    $continue = Read-Host "Continuer quand même? (o/N)"
    if ($continue -ne 'o' -and $continue -ne 'O') {
        Write-Host "`n❌ Démo annulée`n" -ForegroundColor $warning
        exit 1
    }
}

Write-Host "🚀 Lancement de la démo interactive...`n" -ForegroundColor $success

# Lancer Playwright en mode UI (interface graphique)
npx playwright test tests/e2e/demo-login-simple.spec.ts --ui

Write-Host "`n✅ Démo terminée!`n" -ForegroundColor $success
