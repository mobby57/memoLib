@echo off
echo ========================================
echo   SecureVault - Demarrage Monitoring
echo ========================================

echo.
echo 1. Demarrage stack monitoring...
docker compose -f docker-compose.monitoring.yml up -d
if errorlevel 1 (
    echo ERREUR: Echec demarrage monitoring
    pause
    exit /b 1
)

echo.
echo 2. Attente services monitoring...
timeout /t 20 /nobreak >nul

echo.
echo ========================================
echo   Monitoring DEMARRE avec succes!
echo ========================================
echo.
echo 📊 Prometheus: http://localhost:9090
echo 📈 Grafana: http://localhost:3001 (admin/admin)
echo 🔍 Metriques: http://localhost:5000/api/metrics
echo 💚 Sante: http://localhost:5000/api/health/detailed
echo.
echo Appuyez sur une touche pour continuer...
pause >nul