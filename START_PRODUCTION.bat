@echo off
echo ========================================
echo   SecureVault v3.1 - Demarrage Production
echo ========================================

echo.
echo 1. Verification Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Docker non installe
    echo Installez Docker Desktop depuis https://docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo ✅ Docker OK

echo.
echo 2. Arret services existants...
docker compose down >nul 2>&1

echo.
echo 3. Build et demarrage production...
docker compose up -d --build
if errorlevel 1 (
    echo ERREUR: Echec demarrage
    pause
    exit /b 1
)

echo.
echo 4. Attente demarrage services...
timeout /t 15 /nobreak >nul

echo.
echo 5. Verification sante...
curl -f http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo ATTENTION: Service pas encore pret
    echo Attendez 30s et verifiez http://localhost:5000
) else (
    echo ✅ Service OK
)

echo.
echo ========================================
echo   SecureVault DEMARRE avec succes!
echo ========================================
echo.
echo 🌐 Application: http://localhost:5000
echo 📊 Monitoring: http://localhost:9090
echo 📈 Dashboards: http://localhost:3001
echo.
echo Appuyez sur une touche pour continuer...
pause >nul