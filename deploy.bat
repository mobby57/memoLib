@echo off
REM Script de déploiement MemoLib Windows

echo 🚀 Déploiement MemoLib - Cabinet d'Avocat

REM 1. Build Release
echo 📦 Compilation Release...
dotnet publish -c Release -o .\deploy

REM 2. Copie config
echo ⚙️ Configuration...
copy appsettings.LawFirm.json .\deploy\ >nul 2>&1
copy appsettings.Production.json .\deploy\ >nul 2>&1

REM 3. Base de données
echo 🗄️ Base de données...
copy memolib.db .\deploy\ >nul 2>&1

echo ✅ Déploiement terminé!
echo 📁 Fichiers dans: .\deploy\
echo 🌐 Lancer avec: cd deploy && MemoLib.Api.exe
pause