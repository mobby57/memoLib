@echo off
echo 🚀 Démarrage iaPosteManager - Mode Local
echo.

REM Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé
    echo Téléchargez Python depuis https://python.org
    pause
    exit /b 1
)

REM Installer les dépendances
echo 📦 Installation des dépendances...
pip install -r requirements.txt

REM Copier la configuration
if not exist .env.production (
    echo ⚙️ Création du fichier de configuration...
    copy .env.example .env.production
)

REM Créer les dossiers nécessaires
if not exist data mkdir data
if not exist logs mkdir logs

REM Démarrer l'application
echo 🎯 Démarrage de l'application...
echo Frontend: http://localhost:3001
echo Backend: http://localhost:5000
echo.
python src/backend/app.py

pause