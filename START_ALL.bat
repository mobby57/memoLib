@echo off
setlocal enabledelayedexpansion
title IAPosteManager v2.2 - Demarrage Automatique

echo ========================================================
echo    DEMARRAGE AUTOMATIQUE - IAPosteManager v2.2
echo ========================================================
echo.

:: Verification rapide
echo [1/5] Verification du projet...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python non installe
    pause
    exit /b 1
)

if not exist "src\backend\app.py" (
    echo [ERREUR] Backend manquant
    pause
    exit /b 1
)

if not exist ".env" (
    echo [ATTENTION] Fichier .env manquant
    echo Copie de .env.example vers .env...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] .env cree depuis .env.example
        echo [INFO] Editez .env pour configurer vos cles API
    ) else (
        echo [ERREUR] .env.example manquant
        pause
        exit /b 1
    )
)

echo [OK] Verification terminee
echo.

:: Installation dependances Python si necessaire
echo [2/5] Verification dependances Python...
python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installation des dependances Python...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec installation dependances Python
        pause
        exit /b 1
    )
)
echo [OK] Dependances Python OK
echo.

:: Installation dependances Node.js si necessaire
echo [3/5] Verification dependances Node.js...
if exist "src\frontend" (
    cd src\frontend
    if not exist "node_modules" (
        echo Installation des dependances Node.js...
        npm install
        if %errorlevel% neq 0 (
            echo [ERREUR] Echec installation dependances Node.js
            cd ..\..
            pause
            exit /b 1
        )
    )
    cd ..\..
)
echo [OK] Dependances Node.js OK
echo.

:: Preparation base de donnees
echo [4/5] Preparation base de donnees...
if not exist "data" mkdir data
echo [OK] Dossier data pret
echo.

:: Demarrage des services
echo [5/5] Demarrage des services...
echo.
echo ========================================================
echo    SERVICES EN COURS DE DEMARRAGE
echo ========================================================
echo.
echo Backend Flask:  http://localhost:5000
echo Frontend React: http://localhost:3001
echo.
echo [INFO] Les services vont demarrer dans des fenetres separees
echo [INFO] Fermez cette fenetre pour arreter tous les services
echo.

:: Demarrage Backend
echo Demarrage du Backend Flask...
start "IAPosteManager Backend" cmd /k "cd /d %~dp0 && python src\backend\app.py"
timeout /t 3 /nobreak >nul

:: Demarrage Frontend
if exist "src\frontend" (
    echo Demarrage du Frontend React...
    start "IAPosteManager Frontend" cmd /k "cd /d %~dp0src\frontend && npm run dev"
    timeout /t 3 /nobreak >nul
)

:: Ouverture navigateur
echo Ouverture du navigateur...
timeout /t 5 /nobreak >nul
start http://localhost:3001

echo.
echo ========================================================
echo    SERVICES DEMARRES AVEC SUCCES!
echo ========================================================
echo.
echo URLs d'acces:
echo   Frontend: http://localhost:3001
echo   Backend:  http://localhost:5000
echo   API:      http://localhost:5000/api
echo.
echo [INFO] Appuyez sur une touche pour arreter tous les services
pause >nul

:: Arret des services
echo.
echo Arret des services...
taskkill /f /fi "WindowTitle eq IAPosteManager Backend*" >nul 2>&1
taskkill /f /fi "WindowTitle eq IAPosteManager Frontend*" >nul 2>&1
echo Services arretes.