@echo off
echo 🚀 Déploiement Heroku - IA Poste Manager v2.3
echo ==========================================

REM Vérifier si Heroku CLI est installé
heroku --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Heroku CLI non installé
    echo 📥 Téléchargez depuis: https://devcenter.heroku.com/articles/heroku-cli
    pause
    exit /b 1
)

REM Login Heroku
echo 🔐 Connexion Heroku...
heroku login

REM Créer app Heroku
echo 📱 Création app iapostemanager...
heroku create iapostemanager

REM Configurer variables d'environnement
echo ⚙️ Configuration variables...
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=%RANDOM%%RANDOM%%RANDOM%
heroku config:set OPENAI_API_KEY=sk-proj-your_actual_openai_key_here

REM Initialiser Git si nécessaire
if not exist ".git" (
    echo 📦 Initialisation Git...
    git init
    git add .
    git commit -m "Initial commit"
)

REM Déployer
echo 🚀 Déploiement...
git push heroku main

echo ✅ Déploiement terminé!
echo 🌐 App disponible sur: https://iapostemanager.herokuapp.com
pause