@echo off
echo ================================================
echo IAPosteManager v2.2 - Frontend React
echo ================================================
echo.
echo Installation des dependances...
call npm install
echo.
echo Demarrage du frontend React...
echo URL: http://127.0.0.1:3001
echo.
echo IMPORTANT: Assurez-vous que le backend API tourne sur le port 5000
echo ================================================
echo.

call npm run dev

pause