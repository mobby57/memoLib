@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════╗
echo ║     SecureVault - Assistant Email IA          ║
echo ║     Guide de Démarrage Rapide                 ║
echo ╚════════════════════════════════════════════════╝
echo.
echo 🎯 CHOISISSEZ VOTRE MODE DE LANCEMENT :
echo.
echo [1] Docker avec Watch Mode (Recommandé)
echo     → Environnement isolé + Synchronisation auto
echo.
echo [2] Python Local
echo     → Lancement direct sur votre machine
echo.
echo [3] Envoi en Masse
echo     → Interface pour envoyer à plusieurs destinataires
echo.
echo [4] Panneau Admin SMTP
echo     → Gestion des utilisateurs SMTP
echo.
echo [5] Voir la Documentation
echo.
echo [6] Vérifier la Configuration
echo.
echo [Q] Quitter
echo.
set /p choice="Votre choix : "

if "%choice%"=="1" goto docker
if "%choice%"=="2" goto local
if "%choice%"=="3" goto masse
if "%choice%"=="4" goto admin
if "%choice%"=="5" goto doc
if "%choice%"=="6" goto check
if /i "%choice%"=="Q" exit /b 0

echo Choix invalide !
timeout /t 2 >nul
goto :eof

:docker
echo.
echo ═══════════════════════════════════════════════════
echo   Démarrage Docker avec Watch Mode
echo ═══════════════════════════════════════════════════
echo.
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé
    echo.
    echo Téléchargez Docker Desktop :
    echo https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker détecté
echo.

if not exist .env (
    echo 📝 Création du fichier .env...
    copy .env.example .env >nul
    echo.
    echo ⚠️  Pensez à configurer vos clés dans .env
    echo.
)

echo 🚀 Lancement de l'application...
echo 📡 Accès : http://localhost:5000
echo 🔄 Mode Watch actif - Les modifications seront synchronisées
echo.
echo Appuyez sur Ctrl+C pour arrêter
echo.
docker compose up --watch
goto :eof

:local
echo.
echo ═══════════════════════════════════════════════════
echo   Démarrage Python Local
echo ═══════════════════════════════════════════════════
echo.
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé
    pause
    exit /b 1
)

echo ✅ Python détecté
echo.
echo 📦 Vérification des dépendances...
pip install -r requirements.txt >nul 2>&1

echo.
echo 🚀 Lancement de l'application...
echo 📡 Accès : http://localhost:5000
echo.
python app.py
goto :eof

:masse
echo.
echo ═══════════════════════════════════════════════════
echo   Interface d'Envoi en Masse
echo ═══════════════════════════════════════════════════
echo.
python envoi_masse_gui.py
goto :eof

:admin
echo.
echo ═══════════════════════════════════════════════════
echo   Panneau Admin SMTP
echo ═══════════════════════════════════════════════════
echo.
python admin_smtp_panel.py
goto :eof

:doc
echo.
echo ═══════════════════════════════════════════════════
echo   Documentation Disponible
echo ═══════════════════════════════════════════════════
echo.
echo 📖 Guides disponibles :
echo.
echo   • GUIDE_UTILISATION.md       → Guide utilisateur complet
echo   • DOCKER_GUIDE.md            → Guide Docker et Watch Mode
echo   • README_COMPLET.txt         → Documentation technique
echo   • GUIDE_APP_PASSWORD.md      → Configuration Gmail/Outlook
echo.
echo Voulez-vous ouvrir le guide utilisateur ? (O/N)
set /p open="Votre choix : "
if /i "%open%"=="O" start GUIDE_UTILISATION.md
echo.
pause
goto :eof

:check
echo.
echo ═══════════════════════════════════════════════════
echo   Vérification de la Configuration
echo ═══════════════════════════════════════════════════
echo.

echo Vérification Python...
python --version 2>nul
if errorlevel 1 (
    echo ❌ Python : NON INSTALLÉ
) else (
    echo ✅ Python : OK
)

echo.
echo Vérification Docker...
docker --version 2>nul
if errorlevel 1 (
    echo ❌ Docker : NON INSTALLÉ
) else (
    echo ✅ Docker : OK
)

echo.
echo Vérification des fichiers de configuration...
if exist .env (
    echo ✅ .env : OK
) else (
    echo ⚠️  .env : MANQUANT (utilisera .env.example)
)

if exist credentials.enc (
    echo ✅ credentials.enc : OK
) else (
    echo ℹ️  credentials.enc : Pas encore configuré
)

if exist requirements.txt (
    echo ✅ requirements.txt : OK
) else (
    echo ❌ requirements.txt : MANQUANT
)

echo.
echo Vérification des dépendances Python...
python -c "import flask; print('✅ Flask : OK')" 2>nul || echo ❌ Flask : MANQUANT
python -c "import cryptography; print('✅ cryptography : OK')" 2>nul || echo ❌ cryptography : MANQUANT
python -c "import openai; print('✅ openai : OK')" 2>nul || echo ⚠️  openai : MANQUANT (optionnel)

echo.
echo ═══════════════════════════════════════════════════
pause
goto :eof
