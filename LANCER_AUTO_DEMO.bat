@echo off
REM ============================================================================
REM  LANCEUR AUTO-DEMO - Email Assistant IA
REM  Sélection du mode d'exécution
REM ============================================================================

chcp 65001 >nul
title 🎬 Lanceur AUTO-DEMO

color 0B
cls

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║                                                                        ║
echo ║                🎬 AUTO-DEMO - EMAIL ASSISTANT IA                       ║
echo ║                                                                        ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.
echo.
echo   Choisissez votre mode d'exécution :
echo.
echo   ┌──────────────────────────────────────────────────────────────────┐
echo   │                                                                  │
echo   │  [1] 🚀 DEMO RAPIDE (Batch)                                     │
echo   │      • Interface simple et rapide                               │
echo   │      • Tests automatiques                                       │
echo   │      • Durée : 3-5 minutes                                      │
echo   │                                                                  │
echo   │  [2] 💎 DEMO COMPLETE (PowerShell)                              │
echo   │      • Interface améliorée et colorée                           │
echo   │      • Rapport détaillé                                         │
echo   │      • Menu interactif                                          │
echo   │      • Durée : 3-5 minutes                                      │
echo   │                                                                  │
echo   │  [3] ⚡ MODE RAPIDE (PowerShell Quick)                          │
echo   │      • Sans pauses                                              │
echo   │      • Tests uniquement                                         │
echo   │      • Durée : 1-2 minutes                                      │
echo   │                                                                  │
echo   │  [4] 📊 AVEC RAPPORT COMPLET (PowerShell)                       │
echo   │      • Génère un rapport JSON                                   │
echo   │      • Statistiques détaillées                                  │
echo   │      • Export automatique                                       │
echo   │                                                                  │
echo   │  [5] 📚 Voir la Documentation                                   │
echo   │                                                                  │
echo   │  [Q] Quitter                                                    │
echo   │                                                                  │
echo   └──────────────────────────────────────────────────────────────────┘
echo.
echo.

choice /c 12345Q /n /m "   Votre choix : "

if errorlevel 6 goto :quit
if errorlevel 5 goto :docs
if errorlevel 4 goto :full_report
if errorlevel 3 goto :quick_mode
if errorlevel 2 goto :powershell_demo
if errorlevel 1 goto :batch_demo

:batch_demo
cls
echo.
echo   🚀 Lancement de la DEMO RAPIDE (Batch)...
echo.
timeout /t 2 /nobreak >nul
call AUTO_DEMO_COMPLET.bat
goto :end

:powershell_demo
cls
echo.
echo   💎 Lancement de la DEMO COMPLETE (PowerShell)...
echo.
timeout /t 2 /nobreak >nul
powershell -ExecutionPolicy Bypass -File AUTO_DEMO_COMPLET.ps1
goto :end

:quick_mode
cls
echo.
echo   ⚡ Lancement en MODE RAPIDE...
echo.
timeout /t 2 /nobreak >nul
powershell -ExecutionPolicy Bypass -File AUTO_DEMO_COMPLET.ps1 -QuickMode
goto :end

:full_report
cls
echo.
echo   📊 Lancement avec RAPPORT COMPLET...
echo.
timeout /t 2 /nobreak >nul
powershell -ExecutionPolicy Bypass -File AUTO_DEMO_COMPLET.ps1 -FullReport
goto :end

:docs
cls
echo.
echo   📚 Ouverture de la documentation...
echo.
if exist "docs\PARCOURS_UTILISATEUR_COMPLET.md" (
    start docs\PARCOURS_UTILISATEUR_COMPLET.md
) else if exist "PARCOURS_UTILISATEUR_COMPLET.md" (
    start PARCOURS_UTILISATEUR_COMPLET.md
) else (
    echo   ⚠️  Documentation non trouvée
    timeout /t 3 /nobreak >nul
)
goto :eof

:quit
cls
echo.
echo   👋 Au revoir !
echo.
timeout /t 1 /nobreak >nul
exit /b 0

:end
echo.
echo.
echo   ═══════════════════════════════════════════════════════════════
echo   Démonstration terminée !
echo   ═══════════════════════════════════════════════════════════════
echo.
pause
goto :eof
