@echo off
chcp 65001 >nul
title MemoLib API - Démarrage Simple

echo.
echo 🚀 DEMARRAGE MEMOLIB API
echo ========================
echo.

cd /d "c:\Users\moros\Desktop\memolib\MemoLib.Api"

echo 📁 Répertoire: %CD%
echo.

echo 🔨 Compilation...
dotnet build --no-restore
if errorlevel 1 (
    echo ❌ Erreur de compilation!
    pause
    exit /b 1
)

echo.
echo 🎯 LANCEMENT DE L'API
echo ====================
echo.
echo 📍 URLs importantes:
echo    🌐 Interface: http://localhost:5078/demo.html
echo    🔌 API:       http://localhost:5078/api
echo    ❤️  Santé:    http://localhost:5078/health
echo.
echo 💡 Appuyez sur Ctrl+C pour arrêter
echo.

set ASPNETCORE_ENVIRONMENT=Development
set DOTNET_ENVIRONMENT=Development

dotnet run --no-build

pause