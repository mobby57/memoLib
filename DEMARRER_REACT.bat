@echo off
echo ================================================
echo IAPosteManager v2.2 - Mode React + API
echo ================================================
echo.
echo Demarrage du backend API...
echo Backend: http://127.0.0.1:5000
echo Frontend: http://127.0.0.1:3001
echo.
echo INSTRUCTIONS:
echo 1. Ce script demarre le backend API
echo 2. Ouvrir un autre terminal et executer:
echo    cd frontend-react
echo    npm install
echo    npm run dev
echo.
echo Pour arreter: Ctrl+C
echo ================================================
echo.

cd /d "%~dp0"
python backend_api.py

pause