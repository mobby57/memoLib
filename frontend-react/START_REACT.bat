@echo off
echo ========================================
echo   IAPosteManager Frontend React
echo ========================================
echo.

cd /d "%~dp0"

echo Installation des dependances...
call npm install

echo.
echo Demarrage du serveur de developpement...
echo URL: http://localhost:3000
echo.

call npm run dev

pause