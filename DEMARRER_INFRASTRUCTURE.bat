@echo off
REM =====================================================
REM DEMARRAGE INFRASTRUCTURE COMPLETE - iaPosteManager
REM =====================================================

echo.
echo ========================================
echo   INFRASTRUCTURE IAPOSTEMANAGER
echo ========================================
echo.

:MENU
echo.
echo Choisissez une option:
echo.
echo [1] Demarrer APPLICATION (Docker Production)
echo [2] Demarrer MONITORING (Prometheus + Grafana)
echo [3] Demarrer TOUT (Application + Monitoring)
echo [4] Arreter APPLICATION
echo [5] Arreter MONITORING
echo [6] Arreter TOUT
echo [7] Status de tous les services
echo [8] Tests API
echo [9] Logs application
echo [0] Quitter
echo.

set /p choice="Votre choix (0-9): "

if "%choice%"=="1" goto START_APP
if "%choice%"=="2" goto START_MONITORING
if "%choice%"=="3" goto START_ALL
if "%choice%"=="4" goto STOP_APP
if "%choice%"=="5" goto STOP_MONITORING
if "%choice%"=="6" goto STOP_ALL
if "%choice%"=="7" goto STATUS
if "%choice%"=="8" goto TESTS
if "%choice%"=="9" goto LOGS
if "%choice%"=="0" goto END

echo Choix invalide!
goto MENU

:START_APP
echo.
echo [1/2] Demarrage application...
docker-compose -f docker-compose.prod.yml up -d
echo.
echo [2/2] Verification sante...
timeout /t 5 /nobreak >nul
curl -s http://localhost:5000/api/health
echo.
echo.
echo ========================================
echo   APPLICATION DEMARREE!
echo ========================================
echo   URL: http://localhost:5000
echo ========================================
goto MENU

:START_MONITORING
echo.
echo [1/2] Demarrage stack monitoring...
docker-compose -f monitoring\docker-compose.monitoring.yml up -d
echo.
echo [2/2] Verification services...
timeout /t 5 /nobreak >nul
docker-compose -f monitoring\docker-compose.monitoring.yml ps
echo.
echo ========================================
echo   MONITORING DEMARRE!
echo ========================================
echo   Prometheus: http://localhost:9090
echo   Grafana:    http://localhost:3000
echo              (admin/admin)
echo   Alertmanager: http://localhost:9093
echo ========================================
goto MENU

:START_ALL
echo.
echo [1/4] Demarrage application...
docker-compose -f docker-compose.prod.yml up -d
echo.
echo [2/4] Demarrage monitoring...
docker-compose -f monitoring\docker-compose.monitoring.yml up -d
echo.
echo [3/4] Attente demarrage...
timeout /t 10 /nobreak >nul
echo.
echo [4/4] Verification sante...
curl -s http://localhost:5000/api/health
echo.
echo.
echo ========================================
echo   TOUT EST DEMARRE!
echo ========================================
echo   Application:  http://localhost:5000
echo   Prometheus:   http://localhost:9090
echo   Grafana:      http://localhost:3000
echo   Alertmanager: http://localhost:9093
echo ========================================
goto MENU

:STOP_APP
echo.
echo Arret application...
docker-compose -f docker-compose.prod.yml down
echo.
echo Application arretee.
goto MENU

:STOP_MONITORING
echo.
echo Arret monitoring...
docker-compose -f monitoring\docker-compose.monitoring.yml down
echo.
echo Monitoring arrete.
goto MENU

:STOP_ALL
echo.
echo [1/2] Arret application...
docker-compose -f docker-compose.prod.yml down
echo.
echo [2/2] Arret monitoring...
docker-compose -f monitoring\docker-compose.monitoring.yml down
echo.
echo Tous les services sont arretes.
goto MENU

:STATUS
echo.
echo ========================================
echo   STATUS INFRASTRUCTURE
echo ========================================
echo.
echo --- APPLICATION ---
docker-compose -f docker-compose.prod.yml ps
echo.
echo --- MONITORING ---
docker-compose -f monitoring\docker-compose.monitoring.yml ps
echo.
echo --- SANTE API ---
curl -s http://localhost:5000/api/health 2>nul
if errorlevel 1 (
    echo Application non accessible
) else (
    echo OK
)
echo.
goto MENU

:TESTS
echo.
echo ========================================
echo   TESTS API
echo ========================================
echo.
echo [Test 1/5] Health Check...
curl -s -w "%%{http_code}" -o nul http://localhost:5000/api/health
echo.
echo [Test 2/5] Accessibility...
curl -s -w "%%{http_code}" -o nul http://localhost:5000/api/accessibility/settings
echo.
echo [Test 3/5] Templates...
curl -s -w "%%{http_code}" -o nul http://localhost:5000/api/templates
echo.
echo [Test 4/5] Config...
curl -s -w "%%{http_code}" -o nul http://localhost:5000/api/config/settings
echo.
echo [Test 5/5] Frontend...
curl -s -w "%%{http_code}" -o nul http://localhost:5000/
echo.
echo.
echo Tests termines!
goto MENU

:LOGS
echo.
echo ========================================
echo   LOGS APPLICATION (20 dernieres lignes)
echo ========================================
echo.
docker-compose -f docker-compose.prod.yml logs --tail=20 backend
echo.
pause
goto MENU

:END
echo.
echo Au revoir!
exit /b 0
