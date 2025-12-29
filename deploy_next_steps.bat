@echo off
echo 🚀 Déploiement Heroku - IA Poste Manager v2.3
echo ==========================================

echo ✅ Pre-commit fixé
echo 📦 Fichiers committés

echo 🔐 Étape suivante: Connexion Heroku
echo Exécutez manuellement:
echo.
echo heroku login
echo heroku create iapostemanager
echo heroku config:set FLASK_ENV=production
echo heroku config:set OPENAI_API_KEY=your_actual_key
echo git push heroku main
echo.
echo 🌐 App sera disponible sur: https://iapostemanager.herokuapp.com

pause