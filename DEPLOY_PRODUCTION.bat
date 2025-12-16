@echo off
REM Script Windows pour déploiement production iaPosteManager
REM Alternative simple au script Python

echo ========================================
echo   DEPLOIEMENT PRODUCTION - iaPosteManager
echo ========================================
echo.

REM Vérifier Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker n'est pas installe ou demarre
    pause
    exit /b 1
)

REM Vérifier .env.production
if not exist .env.production (
    echo [ERREUR] Fichier .env.production manquant
    pause
    exit /b 1
)

echo [OK] Prerequis verifies
echo.

REM Demander confirmation
set /p confirm="Continuer le deploiement en production? (y/N): "
if /i not "%confirm%"=="y" (
    echo Deploiement annule
    exit /b 0
)

echo.
echo [1/5] Execution des tests E2E...
cd src\frontend
start /b python ..\..\src\backend\app.py
timeout /t 3 /nobreak >nul
call npx playwright test tests/e2e/user-journeys.spec.js --reporter=line
if %errorlevel% neq 0 (
    echo [AVERTISSEMENT] Des tests ont echoue
    set /p continue_tests="Continuer quand meme? (y/N): "
    if /i not "!continue_tests!"=="y" exit /b 1
)
taskkill /f /im python.exe >nul 2>&1
cd ..\..

echo.
echo [2/5] Build du frontend...
cd src\frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERREUR] Build frontend echoue
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo [OK] Frontend builde

echo.
echo [3/5] Build de l'image Docker...
docker build -t iapostemanager:latest .
if %errorlevel% neq 0 (
    echo [ERREUR] Build Docker echoue
    pause
    exit /b 1
)
echo [OK] Image Docker creee

echo.
echo [4/5] Arret des containers existants...
docker-compose -f docker-compose.prod.yml down
echo [OK] Containers arretes

echo.
echo [5/5] Deploiement en production...
docker-compose -f docker-compose.prod.yml up -d
if %errorlevel% neq 0 (
    echo [ERREUR] Deploiement echoue
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOIEMENT REUSSI!
echo ========================================
echo.
echo Application accessible sur:
echo   - Backend: http://localhost:5000
echo   - Frontend: http://localhost:5000
echo.
echo Commandes utiles:
echo   - Logs: docker-compose -f docker-compose.prod.yml logs -f
echo   - Status: docker-compose -f docker-compose.prod.yml ps
echo   - Arret: docker-compose -f docker-compose.prod.yml down
echo.
pause
