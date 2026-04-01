@echo off
echo ========================================
echo   MemoLib - Demarrage Complet
echo ========================================
echo.

echo [1/2] Demarrage API .NET (HTTPS)...
start "MemoLib API" cmd /k "dotnet run"
timeout /t 5 /nobreak >nul

echo [2/2] Demarrage Demo Next.js...
start "MemoLib Demo" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Serveurs demarres !
echo ========================================
echo.
echo API .NET:
echo   - HTTPS: https://localhost:7009
echo   - HTTP:  http://localhost:5078
echo.
echo Demo Next.js:
echo   - Local: http://localhost:3000
echo.
echo Appuyez sur une touche pour fermer...
pause >nul