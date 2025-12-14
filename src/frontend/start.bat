@echo off
echo ========================================
echo   IAPosteManager React Frontend
echo ========================================
echo.

REM Vérifier Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js non installé
    echo Téléchargez Node.js sur https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js installé
echo.

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo Installation des dépendances...
    call npm install
    if errorlevel 1 (
        echo [ERREUR] Installation échouée
        pause
        exit /b 1
    )
    echo [OK] Dépendances installées
    echo.
)

REM Démarrer le serveur de développement
echo Démarrage du serveur React...
echo.
echo URL: http://localhost:3001
echo.
echo Appuyez sur Ctrl+C pour arrêter
echo.

npm run dev

pause
