@echo off
chcp 65001 >nul
title Configuration Webhooks Twilio

echo.
echo ========================================
echo   CONFIGURATION WEBHOOKS TWILIO
echo ========================================
echo.
echo Pour recevoir les SMS dans MemoLib, il faut :
echo 1. Exposer l'API locale avec ngrok
echo 2. Configurer le webhook dans Twilio
echo.
pause

echo.
echo [ETAPE 1] Telechargement ngrok
echo.
echo 1. Allez sur : https://ngrok.com/download
echo 2. Telechargez ngrok pour Windows
echo 3. Decompressez ngrok.exe dans ce dossier
echo.
echo OU utilisez winget :
echo    winget install ngrok
echo.
pause

echo.
echo [ETAPE 2] Lancement ngrok
echo.
echo Lancez dans un nouveau terminal :
echo    ngrok http 5078
echo.
echo Copiez l'URL qui apparait (ex: https://xxxx.ngrok.io)
echo.
set /p NGROK_URL="Collez l'URL ngrok ici: "

echo.
echo [ETAPE 3] Configuration Twilio
echo.
echo 1. Allez sur : https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
echo 2. Cliquez sur votre numero : +19564490871
echo 3. Dans "Messaging Configuration" :
echo    - A MESSAGE COMES IN : Webhook
echo    - URL : %NGROK_URL%/api/messaging/sms/webhook
echo    - HTTP POST
echo 4. Cliquez "Save"
echo.
pause

echo.
echo ========================================
echo   CONFIGURATION TERMINEE !
echo ========================================
echo.
echo TESTEZ MAINTENANT :
echo 1. Envoyez un SMS depuis votre telephone (+33603983709)
echo 2. Vers le numero Twilio : +19564490871
echo 3. Le SMS apparait dans MemoLib !
echo.
echo Verifiez sur : http://localhost:5078/demo.html
echo.
pause
