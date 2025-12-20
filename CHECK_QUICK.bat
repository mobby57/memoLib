@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo    VERIFICATION RAPIDE - IAPosteManager v2.2
echo ========================================================

set ERROR_COUNT=0
set SUCCESS_COUNT=0

:: Structure
if exist "src\backend\app.py" (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] app.py manquant & set /a ERROR_COUNT+=1)
if exist "src\frontend\package.json" (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] package.json manquant & set /a ERROR_COUNT+=1)
if exist "requirements.txt" (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] requirements.txt manquant & set /a ERROR_COUNT+=1)

:: Python
python --version >nul 2>&1
if %errorlevel% equ 0 (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Python non installe & set /a ERROR_COUNT+=1)

:: Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Node.js non installe & set /a ERROR_COUNT+=1)

:: Dependances Python
python -c "import flask" >nul 2>&1
if %errorlevel% equ 0 (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Flask manquant & set /a ERROR_COUNT+=1)

python -c "import openai" >nul 2>&1
if %errorlevel% equ 0 (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] OpenAI SDK manquant & set /a ERROR_COUNT+=1)

:: Configuration
if exist ".env" (
    set /a SUCCESS_COUNT+=1
    findstr /C:"OPENAI_API_KEY" .env >nul 2>&1
    if %errorlevel% equ 0 (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] OPENAI_API_KEY manquant & set /a ERROR_COUNT+=1)
) else (
    echo [ERREUR] Fichier .env manquant
    set /a ERROR_COUNT+=1
)

:: Test syntaxe
python -m py_compile src\backend\app.py >nul 2>&1
if %errorlevel% equ 0 (set /a SUCCESS_COUNT+=1) else (echo [ERREUR] Erreur syntaxe backend & set /a ERROR_COUNT+=1)

echo.
echo ========================================================
echo RESULTAT: %SUCCESS_COUNT% OK - %ERROR_COUNT% ERREURS
echo ========================================================

if %ERROR_COUNT% equ 0 (
    echo [SUCCESS] PROJET PRET A DEMARRER!
    echo.
    echo Commandes:
    echo   Backend:  python src\backend\app.py
    echo   Frontend: cd src\frontend ^&^& npm run dev
) else (
    echo [ATTENTION] Corriger les erreurs avant de continuer
    echo.
    echo Actions:
    echo   1. pip install -r requirements.txt
    echo   2. Copier .env.example vers .env
    echo   3. cd src\frontend ^&^& npm install
)