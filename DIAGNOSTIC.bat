@echo off
echo ========================================
echo   DIAGNOSTIC SecureVault
echo ========================================

echo.
echo 1. Verification Docker...
docker --version
if errorlevel 1 (
    echo ❌ Docker non installe
    echo Installez Docker Desktop: https://docker.com/products/docker-desktop
    goto :end
) else (
    echo ✅ Docker OK
)

echo.
echo 2. Verification Docker daemon...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker daemon non demarre
    echo Demarrez Docker Desktop
    goto :end
) else (
    echo ✅ Docker daemon OK
)

echo.
echo 3. Verification fichiers...
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml manquant
    goto :end
) else (
    echo ✅ docker-compose.yml OK
)

if not exist "Dockerfile" (
    echo ❌ Dockerfile manquant
    goto :end
) else (
    echo ✅ Dockerfile OK
)

if not exist "requirements.txt" (
    echo ❌ requirements.txt manquant
    goto :end
) else (
    echo ✅ requirements.txt OK
)

if not exist "src\web\app.py" (
    echo ❌ src\web\app.py manquant
    goto :end
) else (
    echo ✅ app.py OK
)

echo.
echo 4. Verification ports...
netstat -an | findstr :5000 >nul
if not errorlevel 1 (
    echo ⚠️ Port 5000 occupe
    echo Arretez le service qui utilise le port 5000
) else (
    echo ✅ Port 5000 libre
)

echo.
echo 5. Test build Docker...
docker compose config >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur configuration Docker Compose
    docker compose config
    goto :end
) else (
    echo ✅ Configuration Docker Compose OK
)

echo.
echo ========================================
echo   DIAGNOSTIC TERMINE
echo ========================================
echo.
echo Si tout est OK, executez: START_SIMPLE.bat

:end
echo.
pause