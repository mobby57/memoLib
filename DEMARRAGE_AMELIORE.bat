@echo off
chcp 65001 >nul
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         SecureVault v2.2.1 - Version Améliorée              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/4] Vérification configuration...
if not exist .env (
    echo ⚠️  Fichier .env manquant
    echo Création depuis .env.example...
    copy .env.example .env >nul
    echo ✅ Fichier .env créé - EDITEZ-LE avec vos valeurs !
    pause
    exit /b 1
)

echo [2/4] Génération SECRET_KEY...
for /f "delims=" %%i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set SECRET_KEY=%%i
echo ✅ SECRET_KEY généré

echo.
echo [3/4] Démarrage serveur...
cd src\web
set SECRET_KEY=%SECRET_KEY%
start "SecureVault" python app.py

timeout /t 3 /nobreak >nul

echo.
echo [4/4] Vérification...
cd ..\..
python verifier_serveur.py

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  ✅ Application démarrée avec améliorations !                ║
echo ║  URL: http://127.0.0.1:5000                                  ║
echo ║  Logs: logs\app.log                                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

pause
