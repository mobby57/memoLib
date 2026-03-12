@echo off
echo.
echo ========================================
echo MEMOLIB - DEMO AUTOMATIQUE
echo ========================================
echo.
echo Choisissez le type de demo:
echo.
echo 1. Demo RAPIDE (2 min) - Clients + Dossiers
echo 2. Demo COMPLETE (5 min) - Tout inclus
echo 3. Demo PERSONNALISEE
echo.
set /p choice="Votre choix (1-3): "

if "%choice%"=="1" (
    echo.
    echo Lancement demo rapide...
    powershell -ExecutionPolicy Bypass -File DEMO-AUTO.ps1 -Quick
) else if "%choice%"=="2" (
    echo.
    echo Lancement demo complete...
    powershell -ExecutionPolicy Bypass -File DEMO-AUTO.ps1 -Full
) else if "%choice%"=="3" (
    echo.
    echo Lancement demo standard...
    powershell -ExecutionPolicy Bypass -File DEMO-AUTO.ps1
) else (
    echo.
    echo Choix invalide. Lancement demo standard...
    powershell -ExecutionPolicy Bypass -File DEMO-AUTO.ps1
)

echo.
pause
