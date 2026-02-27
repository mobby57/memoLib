@echo off
chcp 65001 >nul

set EMAIL=sarraboudjellal57@gmail.com
set /p PASSWORD="Mot de passe: "
set MESSAGE=Test SMS depuis MemoLib - %date% %time%

echo.
echo Envoi SMS vers +33603983709...
echo.

curl -s -X POST http://localhost:5078/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\"}" > token.tmp

for /f "usebackq delims=" %%t in (`powershell -NoProfile -Command "$j=Get-Content -Raw 'token.tmp' | ConvertFrom-Json; $j.token"`) do set TOKEN=%%t

if "%TOKEN%"=="" (
    echo [ERREUR] Authentification echouee
    del token.tmp
    pause
    exit /b 1
)

curl -s -X POST http://localhost:5078/api/messaging/sms/send -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"to\":\"+33603983709\",\"body\":\"%MESSAGE%\"}"

echo.
echo.
echo [OK] SMS ENVOYE!
echo Verifiez votre telephone +33603983709

del token.tmp
pause
