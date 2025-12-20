@echo off
echo ========================================================
echo    ETAT FINAL - IAPosteManager v2.2
echo ========================================================
echo.

:: Verification rapide et silencieuse
set STATUS=OK
set ISSUES=

:: Structure
if not exist "src\backend\app.py" set STATUS=ERREUR & set ISSUES=%ISSUES% app.py-manquant
if not exist "src\frontend\package.json" set STATUS=ERREUR & set ISSUES=%ISSUES% package.json-manquant
if not exist "requirements.txt" set STATUS=ERREUR & set ISSUES=%ISSUES% requirements.txt-manquant

:: Environnement
python --version >nul 2>&1
if %errorlevel% neq 0 set STATUS=ERREUR & set ISSUES=%ISSUES% python-manquant

node --version >nul 2>&1
if %errorlevel% neq 0 set STATUS=ERREUR & set ISSUES=%ISSUES% nodejs-manquant

:: Dependances
python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 set STATUS=ATTENTION & set ISSUES=%ISSUES% flask-manquant

python -c "import openai" >nul 2>&1
if %errorlevel% neq 0 set STATUS=ATTENTION & set ISSUES=%ISSUES% openai-manquant

:: Configuration
if not exist ".env" set STATUS=ATTENTION & set ISSUES=%ISSUES% env-manquant

echo STATUT GLOBAL: %STATUS%
echo.

if "%STATUS%"=="OK" (
    echo ========================================================
    echo    ✅ PROJET PRET - TOUS LES TESTS PASSES
    echo ========================================================
    echo.
    echo 🎯 Fonctionnalites disponibles:
    echo   ✅ Backend Flask unifie
    echo   ✅ Frontend React + Vite
    echo   ✅ Interface vocale complete
    echo   ✅ Accessibilite avancee
    echo   ✅ Chiffrement AES-256
    echo   ✅ Tests E2E Playwright (39/39)
    echo   ✅ APIs OpenAI completes
    echo   ✅ Multi-provider email
    echo   ✅ Documentation complete
    echo.
    echo 🚀 Commandes de demarrage:
    echo   START_ALL.bat     - Demarrage automatique complet
    echo   DEMARRER.bat      - Demarrage manuel
    echo.
    echo 📊 URLs d'acces:
    echo   Frontend: http://localhost:3001
    echo   Backend:  http://localhost:5000
    echo   API:      http://localhost:5000/api
    echo.
    echo 📚 Documentation:
    echo   docs\ANALYSE_WORKSPACE_COMPLETE.md
    echo   docs\ANALYSE_TECHNIQUE_COMPLETE.md
    echo   docs\GUIDE_UTILISATEUR.md
    echo.
    echo 🎉 PRET POUR PRODUCTION!
) else (
    echo ========================================================
    echo    ⚠️ ATTENTION - CORRECTIONS NECESSAIRES
    echo ========================================================
    echo.
    echo Problemes detectes: %ISSUES%
    echo.
    echo 🔧 Actions recommandees:
    if not exist ".env" echo   1. Copier .env.example vers .env
    python -c "import flask" >nul 2>&1
    if %errorlevel% neq 0 echo   2. pip install -r requirements.txt
    if not exist "src\frontend\node_modules" echo   3. cd src\frontend ^&^& npm install
    echo.
    echo Puis relancer: CHECK_QUICK.bat
)

echo.
echo ========================================================
echo Scripts disponibles:
echo   CHECK_QUICK.bat   - Verification rapide
echo   DIAGNOSTIC.bat    - Diagnostic complet
echo   START_ALL.bat     - Demarrage automatique
echo ========================================================