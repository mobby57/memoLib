@echo off
chcp 65001 >nul
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         SecureVault v2.2 - Demarrage Correct                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1] Arret des anciens processus...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2] Demarrage du BON fichier: src\web\app.py
echo.

cd src\web
start "SecureVault" python app.py

timeout /t 3 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Application demarree !                                      ║
echo ║  URL: http://127.0.0.1:5000                                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

pause
