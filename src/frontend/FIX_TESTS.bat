@echo off
echo ================================================
echo CORRECTION TESTS E2E
echo ================================================
echo.

echo 1. Demarrage backend API...
start /B python ..\backend_api.py

echo 2. Attente backend (5s)...
timeout /t 5 /nobreak >nul

echo 3. Test backend...
curl -s http://127.0.0.1:5000/api/health
if %errorlevel% neq 0 (
    echo ERREUR: Backend non accessible
    pause
    exit /b 1
)

echo 4. Backend OK - Demarrage frontend...
start /B npm run dev

echo 5. Attente frontend (10s)...
timeout /t 10 /nobreak >nul

echo 6. Test frontend...
curl -s http://127.0.0.1:3001
if %errorlevel% neq 0 (
    echo ERREUR: Frontend non accessible
    pause
    exit /b 1
)

echo 7. Frontend OK - Lancement tests...
npm run test:e2e

pause