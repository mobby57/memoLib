@echo off
echo ========================================
echo   IAPosteManager - Demarrage Complet
echo ========================================

echo 1. Demarrage Backend (port 5000)...
cd src\backend
start /B python app.py
timeout /t 3 /nobreak >nul

echo 2. Demarrage Frontend (port 3001)...
cd ..\frontend
start /B npm run dev
timeout /t 3 /nobreak >nul

echo 3. Ouverture navigateur...
timeout /t 5 /nobreak >nul
start http://localhost:3001

echo ========================================
echo   Serveurs demarres:
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:3001
echo ========================================
echo.
echo Appuyez sur une touche pour fermer...
pause >nul