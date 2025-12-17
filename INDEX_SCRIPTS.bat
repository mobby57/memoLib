@echo off
chcp 65001 > nul
cls

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║           📚 INDEX DES SCRIPTS PARCOURS UTILISATEUR                  ║
echo ║                        iaPostemanage v3.1                            ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo.
echo  📁 FICHIERS DISPONIBLES
echo  ════════════════════════════════════════════════════════════════════
echo.
echo  🚀 SCRIPTS EXECUTABLES
echo  ─────────────────────────────────────────────────────────────────
echo.
echo   1. PARCOURS_UTILISATEUR.bat
echo      └─ Menu interactif simple (recommande pour debuter)
echo      └─ 4 options : Interactif, Auto rapide, Auto custom, Validation
echo.
echo   2. PARCOURS_UTILISATEUR_EMAIL.ps1
echo      └─ Script PowerShell complet (566 lignes)
echo      └─ 10 fonctions, 6 etapes du parcours utilisateur
echo      └─ Modes : Interactif + Automatique
echo.
echo   3. TESTS_AVANCES_EMAIL.ps1
echo      └─ Suite de tests complete (489 lignes)
echo      └─ 22 tests automatises en 6 categories
echo      └─ Modes : QuickTest, FullTest, StressTest
echo.
echo.
echo  📚 DOCUMENTATION
echo  ─────────────────────────────────────────────────────────────────
echo.
echo   4. README_SCRIPTS.md
echo      └─ Navigation rapide et Quick Start (269 lignes)
echo      └─ Guide "Que faire selon votre besoin"
echo.
echo   5. GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md
echo      └─ Guide d'utilisation detaille (328 lignes)
echo      └─ Toutes les options, exemples, depannage
echo.
echo   6. LIVRABLE_SCRIPTS_PARCOURS.md
echo      └─ Vue d'ensemble complete (401 lignes)
echo      └─ Presentation des livrables et fonctionnalites
echo.
echo   7. SYNTHESE_SCRIPTS_PARCOURS.md
echo      └─ Synthese visuelle finale (350+ lignes)
echo      └─ Statistiques, structure, quick reference
echo.
echo.
echo  🎯 RECOMMANDATIONS
echo  ════════════════════════════════════════════════════════════════════
echo.
echo   PREMIERE UTILISATION :
echo     → Lire : README_SCRIPTS.md (5 minutes)
echo     → Lancer : PARCOURS_UTILISATEUR.bat - Option 1
echo.
echo   TESTS RAPIDES :
echo     → Lancer : PARCOURS_UTILISATEUR.bat - Option 2
echo     → Ou : .\TESTS_AVANCES_EMAIL.ps1 -QuickTest
echo.
echo   VALIDATION COMPLETE :
echo     → Lancer : .\TESTS_AVANCES_EMAIL.ps1 -FullTest
echo.
echo   REFERENCE COMPLETE :
echo     → Lire : GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md
echo.
echo.
echo  📊 STATISTIQUES
echo  ════════════════════════════════════════════════════════════════════
echo.

REM Compter les fichiers
set count=0
if exist "PARCOURS_UTILISATEUR.bat" set /a count+=1
if exist "PARCOURS_UTILISATEUR_EMAIL.ps1" set /a count+=1
if exist "TESTS_AVANCES_EMAIL.ps1" set /a count+=1
if exist "README_SCRIPTS.md" set /a count+=1
if exist "GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md" set /a count+=1
if exist "LIVRABLE_SCRIPTS_PARCOURS.md" set /a count+=1
if exist "SYNTHESE_SCRIPTS_PARCOURS.md" set /a count+=1

echo   Fichiers presents : %count%/7
echo   Lignes totales : 2,135+
echo   Tests disponibles : 22
echo   Etapes couvertes : 6
echo.
echo.
echo  🚀 LANCEMENT RAPIDE
echo  ════════════════════════════════════════════════════════════════════
echo.
echo   Choisissez une action :
echo.

:menu
echo     1. Lancer le parcours utilisateur (INTERACTIF)
echo     2. Lancer les tests rapides (VALIDATION)
echo     3. Ouvrir la documentation (README)
echo     4. Voir la synthese complete
echo     5. Quitter
echo.
set /p "action=  Votre choix (1-5) : "

if "%action%"=="1" (
    echo.
    echo   [INFO] Lancement du parcours utilisateur...
    echo.
    if exist "PARCOURS_UTILISATEUR.bat" (
        call PARCOURS_UTILISATEUR.bat
    ) else (
        echo   [ERREUR] Fichier PARCOURS_UTILISATEUR.bat introuvable!
        pause
    )
    goto :end
)

if "%action%"=="2" (
    echo.
    echo   [INFO] Lancement des tests rapides...
    echo.
    if exist "TESTS_AVANCES_EMAIL.ps1" (
        powershell -ExecutionPolicy Bypass -File "TESTS_AVANCES_EMAIL.ps1" -QuickTest
    ) else (
        echo   [ERREUR] Fichier TESTS_AVANCES_EMAIL.ps1 introuvable!
    )
    pause
    goto :end
)

if "%action%"=="3" (
    echo.
    echo   [INFO] Ouverture de la documentation...
    echo.
    if exist "README_SCRIPTS.md" (
        start README_SCRIPTS.md
    ) else (
        echo   [ERREUR] Fichier README_SCRIPTS.md introuvable!
    )
    timeout /t 2 /nobreak > nul
    goto :end
)

if "%action%"=="4" (
    echo.
    echo   [INFO] Ouverture de la synthese...
    echo.
    if exist "SYNTHESE_SCRIPTS_PARCOURS.md" (
        start SYNTHESE_SCRIPTS_PARCOURS.md
    ) else (
        echo   [ERREUR] Fichier SYNTHESE_SCRIPTS_PARCOURS.md introuvable!
    )
    timeout /t 2 /nobreak > nul
    goto :end
)

if "%action%"=="5" (
    echo.
    echo   [INFO] Au revoir!
    echo.
    timeout /t 2 /nobreak > nul
    goto :end
)

echo.
echo   [ERREUR] Choix invalide!
pause
goto :menu

:end
exit /b 0
