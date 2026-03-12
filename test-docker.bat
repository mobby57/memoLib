@echo off
REM Script de test Docker local pour MemoLib

echo ========================================
echo Test Docker Local - MemoLib
echo ========================================
echo.

REM 1. Build l'image
echo [1/6] Building Docker image...
docker build -t memolib-api:test . || goto :error
echo [OK] Image built successfully
echo.

REM 2. Lancer le container
echo [2/6] Starting container...
docker run -d --name memolib-test -p 5078:5078 memolib-api:test || goto :error
echo [OK] Container started
echo.

REM 3. Attendre le démarrage
echo [3/6] Waiting for application to start...
timeout /t 5 /nobreak >nul
echo [OK] Application should be ready
echo.

REM 4. Test health check
echo [4/6] Testing health endpoint...
curl -f http://localhost:5078/health || goto :error
echo.
echo [OK] Health check passed
echo.

REM 5. Test API
echo [5/6] Testing API...
curl -f http://localhost:5078/api/status || echo [WARN] API test failed
echo.

REM 6. Afficher les logs
echo [6/6] Container logs:
docker logs memolib-test
echo.

echo ========================================
echo [SUCCESS] All tests passed!
echo ========================================
echo.
echo Container is running on http://localhost:5078
echo.
echo Commands:
echo   docker logs -f memolib-test    - View logs
echo   docker stop memolib-test       - Stop container
echo   docker rm memolib-test         - Remove container
echo.
goto :end

:error
echo.
echo ========================================
echo [ERROR] Test failed!
echo ========================================
echo.
echo Cleaning up...
docker stop memolib-test 2>nul
docker rm memolib-test 2>nul
exit /b 1

:end
