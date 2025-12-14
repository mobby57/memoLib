@echo off
echo ================================================
echo IAPosteManager v2.2 - Demarrage
echo ================================================
echo.
echo Demarrage de l'application...
echo URL: http://127.0.0.1:5000
echo.
echo Pour arreter: Ctrl+C
echo ================================================
echo.

cd /d "%~dp0"
python src\web\app.py

pause