#!/usr/bin/env powershell
<#
.SYNOPSIS
    Script de démarrage rapide pour tester MemoLib en production

.DESCRIPTION
    Lance les tests E2E de démo et valide l'application complète

.EXAMPLE
    .\demo-launch.ps1

.NOTES
    Assure-toi que:
    - Node.js 18+ est installé
    - Playwright est installé (npm install)
    - L'app est en cours d'exécution (localhost:3000)
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseURL = "http://localhost:3000",

    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev"
)

# Couleurs
$success = "Green"
$warning = "Yellow"
$error_color = "Red"
$info = "Cyan"

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🎬 DÉMO MEMOLIB - SCRIPT DE LANCEMENT 🎬            ║
║                                                                ║
║              Environnement: $Environment                       ║
║              Base URL: $BaseURL                               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

" -ForegroundColor $info

# Vérifier Node.js
Write-Host "⏳ Vérification des prérequis..." -ForegroundColor $info
$nodeVersion = node -v 2>$null
if ($nodeVersion) {
    Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor $success
} else {
    Write-Host "  ❌ Node.js non trouvé" -ForegroundColor $error_color
    exit 1
}

# Vérifier Playwright
$playwrightInstalled = npm list -g @playwright/test 2>$null | Select-String "playwright" | Measure-Object | Select-Object -ExpandProperty Count
if ($playwrightInstalled -gt 0) {
    Write-Host "  ✅ Playwright installé" -ForegroundColor $success
} else {
    Write-Host "  ⚠️  Playwright non détecté globalement, utilisation locale" -ForegroundColor $warning
}

# Vérifier la connectivité à l'API
Write-Host "`n⏳ Vérification de la connectivité API..." -ForegroundColor $info
try {
    $healthCheck = Invoke-WebRequest -Uri "$BaseURL/api/health" -Method Get -TimeoutSec 5 -SkipHttpErrorCheck
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "  ✅ API accessible ($($healthCheck.StatusCode))" -ForegroundColor $success
        $healthData = $healthCheck.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($healthData.services) {
            Write-Host "  Services:" -ForegroundColor $info
            $healthData.services | ForEach-Object {
                $_.PSObject.Properties | ForEach-Object {
                    $status_icon = if ($_.Value -eq "healthy") { "✅" } else { "⚠️" }
                    Write-Host "    $status_icon $($_.Name): $($_.Value)" -ForegroundColor $(if ($_.Value -eq "healthy") { $success } else { $warning })
                }
            }
        }
    } else {
        Write-Host "  ⚠️  API retourne: $($healthCheck.StatusCode)" -ForegroundColor $warning
    }
} catch {
    Write-Host "  ❌ Erreur de connexion: $_" -ForegroundColor $error_color
    Write-Host "  💡 Tip: Lance 'npm run dev' dans src/frontend avant de lancer la démo" -ForegroundColor $info
    exit 1
}

# Menu principal
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $info
Write-Host "║ SÉLECTIONNE UNE OPTION DE DÉMO                              ║" -ForegroundColor $info
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $info

$options = @(
    "1. Tester LOGIN (authentification)",
    "2. Tester DASHBOARD",
    "3. Tester PREUVE LÉGALE (création)",
    "4. Tester LISTE DES PREUVES",
    "5. Tester EXPORT (PDF/JSON/XML)",
    "6. Tester SIGNATURE eIDAS",
    "7. Tester RÈGLES SECTORIELLES",
    "8. Tester SANTÉ API",
    "9. Exécuter TOUS LES TESTS",
    "10. Ouvrir l'APP dans le navigateur",
    "0. Quitter"
)

$options | ForEach-Object { Write-Host "  $_" -ForegroundColor $info }

$choice = Read-Host -Prompt "`nChoix (0-10)"

switch ($choice) {
    "1" {
        Write-Host "`n🔐 Lancement du test LOGIN..." -ForegroundColor $info
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Login avec identifiants de test" --reporter=list
    }
    "2" {
        Write-Host "`n📊 Lancement du test DASHBOARD..." -ForegroundColor $info
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Accès au dashboard principal" --reporter=list
    }
    "3" {
        Write-Host "`n📄 Lancement du test PREUVE LÉGALE..." -ForegroundColor $info
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Générer une preuve légale" --reporter=list
    }
    "4" {
        Write-Host "`n📋 Lancement du test LISTE DES PREUVES..." -ForegroundColor $info
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Afficher la liste des preuves légales" --reporter=list
    }
    "5" {
        Write-Host "`n📊 Lancement du test EXPORT..." -ForegroundColor $info
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Exporter une preuve" --reporter=list
    }
    "6" {
        Write-Host "`n🔐 Lancement du test SIGNATURE eIDAS..." -ForegroundColor $info
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Ajouter une signature eIDAS" --reporter=list
    }
    "7" {
        Write-Host "`n📚 Lancement du test RÈGLES SECTORIELLES..." -ForegroundColor $info
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Consulter les règles sectorielles" --reporter=list
    }
    "8" {
        Write-Host "`n🏥 Lancement du test SANTÉ API..." -ForegroundColor $info
        npx playwright test tests/e2e/demo-complete.spec.ts -g "Vérifier la santé de l'API" --reporter=list
    }
    "9" {
        Write-Host "`n🚀 Lancement de TOUS LES TESTS..." -ForegroundColor $info
        Write-Host "⏱️  Durée estimée: 2-3 minutes" -ForegroundColor $warning

        # Définir la variable d'environnement
        $env:BASE_URL = $BaseURL

        npx playwright test tests/e2e/demo-complete.spec.ts --reporter=list,html

        Write-Host "`n✅ Rapport HTML généré: playwright-report/index.html" -ForegroundColor $success
    }
    "10" {
        Write-Host "`n🌐 Ouverture de l'application..." -ForegroundColor $info
        $url = if ($Environment -eq "prod") {
            "https://memolib.fly.dev"
        } else {
            $BaseURL
        }

        Start-Process $url
        Write-Host "✅ Application ouverte dans le navigateur: $url" -ForegroundColor $success
    }
    "0" {
        Write-Host "`n👋 Au revoir!" -ForegroundColor $info
        exit 0
    }
    default {
        Write-Host "`n❌ Option invalide: $choice" -ForegroundColor $error_color
        exit 1
    }
}

# Résumé final
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $success
Write-Host "║ ✅ TEST COMPLÉTÉ                                           ║" -ForegroundColor $success
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $success

Write-Host @"

📚 Documentation disponible:
  • DEMO_SCRIPT_INTERACTIVE.md    - Guide détaillé de démo
  • docs/ARCHITECTURE.md          - Architecture technique
  • QUICK_START_PRODUCTION.md     - Démarrage rapide

🚀 URLs de production:
  • App:        https://memolib.fly.dev
  • API Health: https://memolib.fly.dev/api/health
  • Login:      https://memolib.fly.dev/auth/login

💬 Support:
  • Email:      contact@memolib.fr
  • Slack:      #memolib-support
  • GitHub:     github.com/mobby57/memoLib

" -ForegroundColor $info

Write-Host "Merci d'avoir testé MemoLib! 🎉" -ForegroundColor $success
