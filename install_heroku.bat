@echo off
echo 📥 Installation Heroku CLI...

REM Download Heroku CLI installer
echo Téléchargement Heroku CLI...
powershell -Command "Invoke-WebRequest -Uri 'https://cli-assets.heroku.com/heroku-x64.exe' -OutFile 'heroku-installer.exe'"

REM Run installer
echo Installation en cours...
start /wait heroku-installer.exe

REM Clean up
del heroku-installer.exe

echo ✅ Heroku CLI installé!
echo 🔄 Redémarrez votre terminal puis exécutez:
echo heroku login

pause