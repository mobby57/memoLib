@echo off
setlocal enabledelayedexpansion
echo.
echo ========================================================
echo    VERIFICATION COMPLETE - IAPosteManager v2.2
echo ========================================================
echo.

set ERROR_COUNT=0
set SUCCESS_COUNT=0
set WARNING_COUNT=0

echo [1/14] Structure Projet...
if exist "src" (echo [OK] Dossier src & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Dossier src manquant & set /a ERROR_COUNT+=1)
if exist "src\backend" (echo [OK] Backend & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Backend manquant & set /a ERROR_COUNT+=1)
if exist "src\frontend" (echo [OK] Frontend & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Frontend manquant & set /a ERROR_COUNT+=1)
if exist "docs" (echo [OK] Documentation & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Documentation manquante & set /a ERROR_COUNT+=1)
if exist "tests" (echo [OK] Tests & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Tests manquants & set /a ERROR_COUNT+=1)

echo.
echo [2/14] Fichiers Critiques...
if exist "src\backend\app.py" (echo [OK] app.py & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] app.py manquant & set /a ERROR_COUNT+=1)
if exist "src\frontend\package.json" (echo [OK] package.json & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] package.json manquant & set /a ERROR_COUNT+=1)
if exist "requirements.txt" (echo [OK] requirements.txt & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] requirements.txt manquant & set /a ERROR_COUNT+=1)
if exist "README.md" (echo [OK] README.md & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] README.md manquant & set /a ERROR_COUNT+=1)

echo.
echo [3/14] Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python --version
    echo [OK] Python installe
    set /a SUCCESS_COUNT+=1
) else (
    echo [ERREUR] Python non installe
    set /a ERROR_COUNT+=1
)

echo.
echo [4/14] Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    node --version
    echo [OK] Node.js installe
    set /a SUCCESS_COUNT+=1
) else (
    echo [ERREUR] Node.js non installe
    set /a ERROR_COUNT+=1
)

npm --version >nul 2>&1
if %errorlevel% equ 0 (
    npm --version
    echo [OK] npm disponible
    set /a SUCCESS_COUNT+=1
) else (
    echo [ERREUR] npm non disponible
    set /a ERROR_COUNT+=1
)

echo.
echo [5/14] Dependances Python...
python -c "import flask" >nul 2>&1
if %errorlevel% equ 0 (echo [OK] Flask installe & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Flask manquant & set /a ERROR_COUNT+=1)

python -c "import openai" >nul 2>&1
if %errorlevel% equ 0 (echo [OK] OpenAI SDK installe & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] OpenAI SDK manquant & set /a ERROR_COUNT+=1)

python -c "import requests" >nul 2>&1
if %errorlevel% equ 0 (echo [OK] Requests installe & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Requests manquant & set /a ERROR_COUNT+=1)

echo.
echo [6/14] Dependances Node.js...
if exist "src\frontend\node_modules" (
    echo [OK] node_modules present
    set /a SUCCESS_COUNT+=1
) else (
    echo [ATTENTION] node_modules manquant - Executer: cd src\frontend ^&^& npm install
    set /a WARNING_COUNT+=1
)

echo.
echo [7/14] Configuration...
if exist ".env" (
    echo [OK] Fichier .env present
    set /a SUCCESS_COUNT+=1
    
    findstr /C:"OPENAI_API_KEY" .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] OPENAI_API_KEY configure
        set /a SUCCESS_COUNT+=1
    ) else (
        echo [ERREUR] OPENAI_API_KEY manquant
        set /a ERROR_COUNT+=1
    )
) else (
    echo [ERREUR] Fichier .env manquant
    echo [INFO] Copier .env.example vers .env et configurer
    set /a ERROR_COUNT+=1
)

echo.
echo [8/14] Base de Donnees...
if exist "data" (echo [OK] Dossier data & set /a SUCCESS_COUNT+=1) else (echo [ATTENTION] Dossier data sera cree & set /a WARNING_COUNT+=1)
if exist "data\unified.db" (echo [OK] unified.db & set /a SUCCESS_COUNT+=1) else (echo [INFO] Base sera creee au demarrage & set /a WARNING_COUNT+=1)

echo.
echo [9/14] Ports...
netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [ATTENTION] Port 5000 occupe
    set /a WARNING_COUNT+=1
) else (
    echo [OK] Port 5000 disponible
    set /a SUCCESS_COUNT+=1
)

netstat -an | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo [ATTENTION] Port 3001 occupe
    set /a WARNING_COUNT+=1
) else (
    echo [OK] Port 3001 disponible
    set /a SUCCESS_COUNT+=1
)

echo.
echo [10/14] Docker (optionnel)...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    docker --version
    echo [OK] Docker installe
    set /a SUCCESS_COUNT+=1
) else (
    echo [INFO] Docker non installe (optionnel)
    set /a WARNING_COUNT+=1
)

echo.
echo [11/14] Test Backend...
python -m py_compile src\backend\app.py >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Syntaxe backend valide
    set /a SUCCESS_COUNT+=1
) else (
    echo [ERREUR] Erreur syntaxe backend
    set /a ERROR_COUNT+=1
)

echo.
echo [12/14] Securite...
if exist "data\credentials.enc" (echo [OK] Credentials chiffres & set /a SUCCESS_COUNT+=1) else (echo [INFO] Seront crees au premier usage & set /a WARNING_COUNT+=1)

echo.
echo [13/14] Tests...
if exist "src\frontend\tests" (echo [OK] Tests E2E & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Tests E2E manquants & set /a ERROR_COUNT+=1)
if exist "tests" (echo [OK] Tests unitaires & set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Tests unitaires manquants & set /a ERROR_COUNT+=1)

echo.
echo [14/14] Documentation...
if exist "docs\ANALYSE_WORKSPACE_COMPLETE.md" (echo [OK] Analyse workspace & set /a SUCCESS_COUNT+=1) else (echo [INFO] Documentation partielle & set /a WARNING_COUNT+=1)
if exist "docs\ANALYSE_TECHNIQUE_COMPLETE.md" (echo [OK] Analyse technique & set /a SUCCESS_COUNT+=1) else (echo [INFO] Documentation partielle & set /a WARNING_COUNT+=1)

echo.
echo ========================================================
echo                    RESUME FINAL
echo ========================================================
echo.
echo Succes:         %SUCCESS_COUNT%
echo Erreurs:        %ERROR_COUNT%
echo Avertissements: %WARNING_COUNT%
echo.

if %ERROR_COUNT% equ 0 (
    echo ========================================================
    echo    TOUT EST OK! Le projet est pret a demarrer
    echo ========================================================
    echo.
    echo Pour demarrer:
    echo   Backend:  python src\backend\app.py
    echo   Frontend: cd src\frontend ^&^& npm run dev
    echo.
    echo Ou utilisez: DEMARRER.bat
) else (
    echo ========================================================
    echo    PROBLEMES DETECTES - Actions requises
    echo ========================================================
    echo.
    if %ERROR_COUNT% gtr 0 (
        echo Actions recommandees:
        echo   1. Installer dependances: pip install -r requirements.txt
        echo   2. Configurer .env depuis .env.example
        echo   3. Installer npm: cd src\frontend ^&^& npm install
    )
)

echo.
echo Verification terminee: %date% %time%
echo.
pause
