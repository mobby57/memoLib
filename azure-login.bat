@echo off
REM Script de connexion Azure pour IA Poste Manager
echo.
echo ========================================
echo Azure Login - IA Poste Manager
echo ========================================
echo.

REM Rafraichir le PATH
echo [1/3] Rechargement du PATH...
call refreshenv >nul 2>&1

REM Verifier Azure CLI
echo [2/3] Verification Azure CLI...
az --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Azure CLI non trouve!
    echo.
    echo Installation requise:
    echo   winget install -e --id Microsoft.AzureCLI
    echo.
    echo Puis relancez ce script.
    pause
    exit /b 1
)

echo [OK] Azure CLI detecte
echo.

REM Connexion
echo [3/3] Connexion a Azure...
echo Une fenetre de navigateur va s'ouvrir.
echo.
az login

if errorlevel 1 (
    echo.
    echo [ERREUR] Echec de connexion
    echo.
    echo Alternative avec code appareil:
    echo   az login --use-device-code
    pause
    exit /b 1
)

echo.
echo ========================================
echo Connexion reussie!
echo ========================================
echo.
echo Liste des subscriptions:
az account list --output table

echo.
echo Prochaines etapes:
echo   1. Verifier la subscription active ci-dessus
echo   2. Creer le Resource Group
echo   3. Suivre docs\AZURE_DEPLOYMENT.md
echo.
pause
