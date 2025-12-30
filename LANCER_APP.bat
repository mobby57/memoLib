@echo off
chcp 65001 > nul
title IA Poste Manager - Édition Avocat v3.0

echo.
echo ============================================================
echo   🚀 IA POSTE MANAGER - ÉDITION AVOCAT v3.0
echo ============================================================
echo.

:: Vérifier si l'environnement virtuel existe
if not exist "venv\" (
    echo ❌ Environnement virtuel non trouvé
    echo.
    echo 💡 Exécutez d'abord : INSTALL.bat
    echo.
    pause
    exit /b 1
)

:: Activer environnement virtuel
echo 📦 Activation environnement virtuel...
call venv\Scripts\activate

:: Vérifier Flask
echo.
echo 🔍 Vérification Flask...
python -c "import flask" 2>nul
if errorlevel 1 (
    echo ❌ Flask non installé
    echo.
    echo 💡 Exécutez d'abord : INSTALL.bat
    echo.
    pause
    exit /b 1
)

:: Lancer l'application
echo.
echo ============================================================
echo   ✅ LANCEMENT DE L'APPLICATION
echo ============================================================
echo.
echo 🌐 URL : http://localhost:5000/login
echo.
echo 🔐 Compte démo :
echo    Username: admin
echo    Password: admin123
echo.
echo ⚖️  Dashboard juridique :
echo    http://localhost:5000/legal/dashboard
echo.
echo ============================================================
echo.
echo 💡 Pour arrêter : Ctrl+C
echo.
echo Démarrage...
echo.

python app.py

pause
