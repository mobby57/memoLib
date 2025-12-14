@echo off
echo ========================================
echo DEMARRAGE COMPLET - TESTS E2E
echo ========================================
echo.

echo [1/3] Demarrage du BACKEND (Flask)...
start "Backend Flask" powershell -NoExit -Command "cd 'C:\Users\moros\Desktop\iaPostemanage'; python src\web\app.py"
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Demarrage du FRONTEND (React/Vite)...
start "Frontend React" powershell -NoExit -Command "cd 'C:\Users\moros\Desktop\iaPostemanage\frontend-react'; npm run dev"
timeout /t 10 /nobreak >nul

echo.
echo [3/3] Attente que les serveurs soient prets...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo SERVEURS DEMARRES !
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Vous pouvez maintenant lancer les tests avec:
echo    RUN_TESTS_E2E.bat
echo.
echo Ou lancer manuellement:
echo    cd frontend-react
echo    npm run test:e2e
echo.
pause
