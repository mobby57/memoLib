@echo off
echo === INSTALLATION HEROKU CLI ===
echo.

echo 1. Telechargement Heroku CLI...
powershell -Command "Invoke-WebRequest -Uri 'https://cli-assets.heroku.com/heroku-x64.exe' -OutFile 'heroku-installer.exe'"

echo 2. Installation...
start /wait heroku-installer.exe

echo 3. Verification...
heroku --version

echo.
echo === DEPLOIEMENT AUTOMATIQUE ===
heroku login
heroku create iapostemanager --region eu
heroku config:set SECRET_KEY="RmuekVcRKUvQrDLqTQWgnNem1hWog-R6IoByxAOgk1Q"
heroku config:set FLASK_ENV="production"
git push heroku main
heroku open

pause