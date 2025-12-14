@echo off
echo ========================================
echo   IAPosteManager v2.2 - Demarrage
echo ========================================
echo.

cd /d "%~dp0"

echo Verification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Python n'est pas installe ou pas dans le PATH
    echo Installez Python depuis https://python.org
    pause
    exit /b 1
)

echo Installation des dependances...
pip install -r requirements.txt

echo.
echo Demarrage de l'application...
echo URL: http://127.0.0.1:5000
echo.

python src\web\app.py

pause