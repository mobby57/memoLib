@echo off
echo 🚀 Démarrage SecureVault Accessible avec Docker
echo ================================================

REM Vérifier Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé ou démarré
    pause
    exit /b 1
)

REM Créer dossiers nécessaires
if not exist "data" mkdir data
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

REM Variables d'environnement
if not defined SECRET_KEY set SECRET_KEY=accessible-vault-2024

echo 🔧 Configuration:
echo    - Interface accessible: ACTIVÉE
echo    - Synthèse vocale: ACTIVÉE
echo    - Reconnaissance vocale: ACTIVÉE
echo    - Port: 5000
echo.

echo 🎯 Options disponibles:
echo    1. Application complète (recommandée)
echo    2. Interface accessible dédiée
echo.

set /p choice="Choisir option (1 ou 2): "

if "%choice%"=="1" (
    echo 🚀 Démarrage application complète...
    docker-compose up --build
) else if "%choice%"=="2" (
    echo 🚀 Démarrage interface accessible dédiée...
    docker-compose -f docker-compose.accessible.yml up --build
) else (
    echo 🚀 Démarrage par défaut...
    docker-compose up --build
)

echo.
echo ✅ Application accessible disponible sur:
echo    🌐 http://localhost:5000
echo    🎤 http://localhost:5000/accessible/
echo.
echo 🎯 Fonctionnalités accessibles:
echo    - Navigation vocale complète
echo    - Interface 3 boutons
echo    - Auto-ajustements utilisateur
echo    - Synthèse vocale intégrée
echo    - Reconnaissance vocale
echo.
pause