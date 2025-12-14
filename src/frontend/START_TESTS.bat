@echo off
echo ================================================
echo TESTS E2E - IAPosteManager
echo ================================================
echo.
echo 1. Demarrage du backend...
start /B python ..\src\web\app.py

echo 2. Attente du serveur backend...
timeout /t 5 /nobreak >nul

echo 3. Verification du backend...
curl -s http://127.0.0.1:5000/api/health >nul
if %errorlevel% neq 0 (
    echo ERREUR: Backend non accessible
    echo Verifiez que le serveur demarre correctement
    pause
    exit /b 1
)

echo 4. Backend OK - Lancement des tests...
echo.
npm run test:e2e

pause