@echo off
cls
echo.
echo ========================================================
echo    IAPosteManager v3.0 - Demarrage Automatique
echo ========================================================
echo.
echo Verification...

REM Verifier si Python est installe
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Python n'est pas installe!
    echo.
    echo Telechargez Python sur: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python detecte
echo.
echo Demarrage du serveur Flask...
echo.
cd src\backend

REM Le port sera auto-detecte (5000, 5001, 5002...)
start "IAPosteManager Server" /MIN python app.py

echo Attente du demarrage du serveur (5 secondes)...
timeout /t 5 /nobreak > nul

echo.
echo ========================================================
echo    CHOIX DE L'INTERFACE
echo ========================================================
echo.
echo [1] Interface React (Moderne avec design glassmorphism)
echo [2] Interface Simple (HTML/JS basique - toujours fonctionnel)
echo.
set /p choice="Votre choix (1 ou 2): "

REM Detecter le port utilise (chercher dans les logs ou utiliser 5000 par defaut)
set PORT=5000

if "%choice%"=="1" (
    echo.
    echo Ouverture de l'interface React...
    start http://localhost:%PORT%
) else if "%choice%"=="2" (
    echo.
    echo Ouverture de l'interface simple...
    start http://localhost:%PORT%/frontend-simple.html
) else (
    echo.
    echo Choix invalide, ouverture de l'interface React par defaut...
    start http://localhost:%PORT%
)

echo.
echo ========================================================
echo    SERVEUR EN COURS D'EXECUTION
echo ========================================================
echo.
echo URLs d'acces:
echo   - React:  http://localhost:%PORT%
echo   - Simple: http://localhost:%PORT%/frontend-simple.html
echo   - API:    http://localhost:%PORT%/api/health
echo.
echo IMPORTANT:
echo   - Le serveur tourne en arriere-plan (fenetre minimisee)
echo   - Pour l'arreter: Fermez la fenetre "IAPosteManager Server"
echo   - Ou utilisez le Gestionnaire des taches
echo.
echo ========================================================
pause
