@echo off
echo.
echo ========================================
echo   MemoLib - Demarrage Automatique
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/3] Verification de l'API...
curl -s http://localhost:5078/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API deja operationnelle
    goto :open_browser
)

echo [2/3] Demarrage de l'API...
taskkill /F /IM MemoLib.Api.exe >nul 2>&1
start /B dotnet run --urls http://localhost:5078

echo [3/3] Attente du demarrage...
timeout /t 5 /nobreak >nul

:wait_loop
curl -s http://localhost:5078/health >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto :wait_loop
)

echo [OK] API prete !

:open_browser
echo.
echo ========================================
echo   Ouverture de l'interface...
echo ========================================
echo.
start http://localhost:5078/demo.html

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
