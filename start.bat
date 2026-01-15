@echo off
title IA Poste Manager - Auto Setup
color 0A

echo.
echo  ██╗ █████╗     ██████╗  ██████╗ ███████╗████████╗███████╗
echo  ██║██╔══██╗    ██╔══██╗██╔═══██╗██╔════╝╚══██╔══╝██╔════╝
echo  ██║███████║    ██████╔╝██║   ██║███████╗   ██║   █████╗  
echo  ██║██╔══██║    ██╔═══╝ ██║   ██║╚════██║   ██║   ██╔══╝  
echo  ██║██║  ██║    ██║     ╚██████╔╝███████║   ██║   ███████╗
echo  ╚═╝╚═╝  ╚═╝    ╚═╝      ╚═════╝ ╚══════╝   ╚═╝   ╚══════╝
echo.
echo                    MANAGER - Auto Setup
echo.

REM Vérifier Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js non trouvé. Installez Node.js depuis https://nodejs.org
    pause
    exit /b 1
)

REM Vérifier npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm non trouvé. Réinstallez Node.js
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Exécuter le script d'auto-setup
echo 🚀 Démarrage de l'auto-configuration...
echo.

node auto-setup.js

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors de la configuration
    pause
    exit /b 1
)

echo.
echo ✅ Configuration terminée avec succès!
echo.
echo 📖 Consultez SECURITY_AUDIT_REPORT.md pour les détails de sécurité
echo.
pause