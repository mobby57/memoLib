@echo off
chcp 65001 >nul
title MemoLib API - Logs Détaillés

echo.
echo 🚀 DEMARRAGE MEMOLIB AVEC LOGS
echo =================================
echo.

REM Vérifier .NET
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo ❌ .NET non trouvé! Installez .NET 9.0
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('dotnet --version') do set DOTNET_VERSION=%%i
echo ✅ .NET Version: %DOTNET_VERSION%

REM Vérifier le répertoire
if not exist "Program.cs" (
    echo ❌ Fichier Program.cs non trouvé!
    echo Assurez-vous d'être dans le dossier MemoLib.Api
    pause
    exit /b 1
)

echo 📁 Répertoire: %CD%
echo.

REM Restaurer si nécessaire
if not exist "bin" (
    echo 📦 Restauration des packages...
    dotnet restore
)

REM Compiler
echo 🔨 Compilation...
dotnet build --no-restore
if errorlevel 1 (
    echo ❌ Erreur de compilation!
    pause
    exit /b 1
)

echo.
echo 🎯 LANCEMENT DE L'API AVEC LOGS DETAILLES
echo =========================================
echo.
echo 📍 URLs importantes:
echo    🌐 Interface: http://localhost:5078/demo.html
echo    🔌 API:       http://localhost:5078/api
echo    ❤️  Santé:    http://localhost:5078/health
echo.
echo 💡 Appuyez sur Ctrl+C pour arrêter
echo.

REM Variables d'environnement
set ASPNETCORE_ENVIRONMENT=Development
set DOTNET_ENVIRONMENT=Development

REM Lancer avec logs détaillés
dotnet run --no-build --verbosity normal

pause