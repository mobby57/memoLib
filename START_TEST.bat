@echo off
echo ========================================
echo SecureVault v2.2 - Test Demarrage
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Verification Python...
python --version
if errorlevel 1 (
    echo ERREUR: Python non trouve
    pause
    exit /b 1
)

echo.
echo [2/3] Demarrage serveur Flask...
echo URL: http://127.0.0.1:5000
echo.
echo IMPORTANT: Utilisation de src\web\app.py (version corrigee)
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

cd src\web
python app.py

pause
