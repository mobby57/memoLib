@echo off
echo ========================================
echo LANCEMENT DES TESTS E2E PLAYWRIGHT
echo ========================================
echo.

echo [1/4] Verification du backend...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost:5000' -UseBasicParsing -ErrorAction SilentlyContinue; if ($response.StatusCode -eq 200) { Write-Host 'Backend OK' -ForegroundColor Green } else { Write-Host 'ERREUR: Backend non demarre sur port 5000' -ForegroundColor Red; exit 1 }"

echo.
echo [2/4] Verification du frontend...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -ErrorAction SilentlyContinue; if ($response.StatusCode -eq 200) { Write-Host 'Frontend OK' -ForegroundColor Green } else { Write-Host 'ERREUR: Frontend non demarre sur port 5173' -ForegroundColor Red; exit 1 }"

echo.
echo [3/4] Lancement des tests...
cd frontend-react
call npm run test:e2e

echo.
echo [4/4] Ouverture du rapport...
timeout /t 2 /nobreak >nul
call npm run test:e2e:report

echo.
echo ========================================
echo TESTS TERMINES
echo ========================================
pause
