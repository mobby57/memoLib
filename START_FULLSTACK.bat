@echo off
echo ========================================
echo   IAPosteManager - Full Stack Startup
echo ========================================
echo.

REM Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python non installe
    pause
    exit /b 1
)
echo [OK] Python installe

REM Vérifier Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js non installe
    pause
    exit /b 1
)
echo [OK] Node.js installe
echo.

REM Démarrer le backend Flask en arrière-plan
echo Demarrage du backend Flask...
cd /d "%~dp0"
set SECRET_KEY=dev-key-%RANDOM%-%RANDOM%
start /B python src\web\app.py

REM Attendre que le backend démarre
echo Attente du backend (5 secondes)...
timeout /t 5 /nobreak >nul

REM Démarrer le frontend React
echo.
echo Demarrage du frontend React...
cd frontend-react

REM Installer les dépendances si nécessaire
if not exist "node_modules" (
    echo Installation des dependances...
    call npm install
)

echo.
echo ========================================
echo   Application demarree!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

call npm run dev

pause
