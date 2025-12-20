@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo    DIAGNOSTIC AVANCE - IAPosteManager v2.2
echo ========================================================
echo.

set LOG_FILE=diagnostic_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%.log
echo Diagnostic du %date% %time% > %LOG_FILE%

echo [DIAGNOSTIC] Analyse en cours...
echo.

:: 1. Environnement systeme
echo [1] ENVIRONNEMENT SYSTEME
echo ----------------------------------------
echo OS: %OS%
echo Processeur: %PROCESSOR_ARCHITECTURE%
echo Utilisateur: %USERNAME%
echo Repertoire: %CD%
echo.

:: 2. Versions logiciels
echo [2] VERSIONS LOGICIELS
echo ----------------------------------------
python --version 2>&1
node --version 2>&1
npm --version 2>&1
git --version 2>&1
docker --version 2>&1
echo.

:: 3. Structure projet detaillee
echo [3] STRUCTURE PROJET
echo ----------------------------------------
echo Fichiers principaux:
if exist "src\backend\app.py" (echo [OK] src\backend\app.py) else (echo [KO] src\backend\app.py MANQUANT)
if exist "src\frontend\package.json" (echo [OK] src\frontend\package.json) else (echo [KO] src\frontend\package.json MANQUANT)
if exist "requirements.txt" (echo [OK] requirements.txt) else (echo [KO] requirements.txt MANQUANT)
if exist ".env" (echo [OK] .env) else (echo [KO] .env MANQUANT)
if exist ".env.example" (echo [OK] .env.example) else (echo [KO] .env.example MANQUANT)

echo.
echo Dossiers:
for %%d in (src docs tests data docker deploy scripts monitoring) do (
    if exist "%%d" (echo [OK] %%d\) else (echo [KO] %%d\ MANQUANT)
)
echo.

:: 4. Dependances Python
echo [4] DEPENDANCES PYTHON
echo ----------------------------------------
echo Test des imports critiques:
python -c "import sys; print('Python path:', sys.executable)" 2>&1
python -c "import flask; print('Flask version:', flask.__version__)" 2>&1
python -c "import openai; print('OpenAI version:', openai.__version__)" 2>&1
python -c "import requests; print('Requests version:', requests.__version__)" 2>&1
python -c "import sqlite3; print('SQLite3 OK')" 2>&1
echo.

:: 5. Configuration
echo [5] CONFIGURATION
echo ----------------------------------------
if exist ".env" (
    echo Variables .env detectees:
    findstr /R "^[A-Z]" .env 2>nul | findstr /V "=" >nul
    if %errorlevel% equ 0 (
        echo [ATTENTION] Variables sans valeur detectees
    )
    
    findstr /C:"OPENAI_API_KEY" .env >nul 2>&1
    if %errorlevel% equ 0 (echo [OK] OPENAI_API_KEY present) else (echo [KO] OPENAI_API_KEY manquant)
    
    findstr /C:"SECRET_KEY" .env >nul 2>&1
    if %errorlevel% equ 0 (echo [OK] SECRET_KEY present) else (echo [KO] SECRET_KEY manquant)
) else (
    echo [KO] Fichier .env manquant
)
echo.

:: 6. Base de donnees
echo [6] BASE DE DONNEES
echo ----------------------------------------
if exist "data" (
    echo Contenu dossier data:
    dir /b data 2>nul
    
    if exist "data\unified.db" (
        for %%i in ("data\unified.db") do echo [OK] unified.db (%%~zi octets)
    ) else (
        echo [INFO] unified.db sera cree au demarrage
    )
) else (
    echo [INFO] Dossier data sera cree automatiquement
)
echo.

:: 7. Ports reseau
echo [7] PORTS RESEAU
echo ----------------------------------------
echo Verification ports critiques:
netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (echo [ATTENTION] Port 5000 occupe) else (echo [OK] Port 5000 libre)

netstat -an | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (echo [ATTENTION] Port 3001 occupe) else (echo [OK] Port 3001 libre)

netstat -an | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (echo [INFO] Port 3000 occupe (Grafana?)") else (echo [OK] Port 3000 libre)
echo.

:: 8. Test syntaxe
echo [8] TEST SYNTAXE
echo ----------------------------------------
echo Test syntaxe Python:
python -m py_compile src\backend\app.py 2>&1
if %errorlevel% equ 0 (echo [OK] Syntaxe backend valide) else (echo [KO] Erreur syntaxe backend)

if exist "src\frontend\package.json" (
    echo Test configuration Node.js:
    cd src\frontend
    npm run build --dry-run >nul 2>&1
    if %errorlevel% equ 0 (echo [OK] Configuration build valide) else (echo [ATTENTION] Probleme configuration build)
    cd ..\..
)
echo.

:: 9. Securite
echo [9] SECURITE
echo ----------------------------------------
if exist "data\credentials.enc" (echo [OK] Credentials chiffres) else (echo [INFO] Seront crees au premier usage)
if exist "data\salt.bin" (echo [OK] Salt cryptographique) else (echo [INFO] Sera genere automatiquement)

echo Verification permissions:
icacls "." | findstr /C:"%USERNAME%" >nul 2>&1
if %errorlevel% equ 0 (echo [OK] Permissions utilisateur) else (echo [ATTENTION] Verifier permissions)
echo.

:: 10. Processus en cours
echo [10] PROCESSUS EN COURS
echo ----------------------------------------
echo Processus Python actifs:
tasklist /fi "imagename eq python.exe" 2>nul | findstr python.exe
if %errorlevel% neq 0 echo Aucun processus Python actif

echo Processus Node actifs:
tasklist /fi "imagename eq node.exe" 2>nul | findstr node.exe
if %errorlevel% neq 0 echo Aucun processus Node actif
echo.

:: Resume final
echo ========================================================
echo                    RESUME DIAGNOSTIC
echo ========================================================
echo.

:: Calcul score sante
set HEALTH_SCORE=0
if exist "src\backend\app.py" set /a HEALTH_SCORE+=10
if exist "src\frontend\package.json" set /a HEALTH_SCORE+=10
if exist "requirements.txt" set /a HEALTH_SCORE+=10
if exist ".env" set /a HEALTH_SCORE+=15

python --version >nul 2>&1
if %errorlevel% equ 0 set /a HEALTH_SCORE+=15

node --version >nul 2>&1
if %errorlevel% equ 0 set /a HEALTH_SCORE+=10

python -c "import flask" >nul 2>&1
if %errorlevel% equ 0 set /a HEALTH_SCORE+=15

python -c "import openai" >nul 2>&1
if %errorlevel% equ 0 set /a HEALTH_SCORE+=15

echo Score de sante du projet: %HEALTH_SCORE%/100
echo.

if %HEALTH_SCORE% geq 90 (
    echo [EXCELLENT] Projet en parfait etat
    echo Pret pour le demarrage en production
) else if %HEALTH_SCORE% geq 70 (
    echo [BON] Projet en bon etat
    echo Quelques optimisations possibles
) else if %HEALTH_SCORE% geq 50 (
    echo [MOYEN] Projet fonctionnel
    echo Corrections recommandees
) else (
    echo [CRITIQUE] Problemes majeurs detectes
    echo Corrections obligatoires avant demarrage
)

echo.
echo Rapport detaille sauvegarde: %LOG_FILE%
echo.
pause