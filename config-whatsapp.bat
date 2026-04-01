@echo off
chcp 65001 >nul
title Configuration WhatsApp MemoLib

echo.
echo ========================================
echo   CONFIGURATION WHATSAPP MEMOLIB
echo ========================================
echo.
echo AVANTAGES WHATSAPP :
echo - Gardez votre numero 0603983709
echo - Gratuit (sandbox Twilio)
echo - Plus simple que SMS
echo - Vos clients utilisent deja WhatsApp
echo.
pause

echo.
echo [ETAPE 1] Activer WhatsApp Sandbox Twilio
echo.
echo 1. Allez sur : https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
echo 2. Vous verrez un numero sandbox : +1 415 523 8886
echo 3. Vous verrez un code : join [code-unique]
echo.
pause

echo.
echo [ETAPE 2] Connecter VOTRE WhatsApp (0603983709)
echo.
echo 1. Ouvrez WhatsApp sur votre telephone
echo 2. Ajoutez le contact : +1 415 523 8886
echo 3. Envoyez le message : join [votre-code]
echo 4. Vous recevez : "You are all set!"
echo.
echo Votre numero 0603983709 est maintenant connecte !
echo.
pause

echo.
echo [ETAPE 3] Installer ngrok
echo.
where ngrok >nul 2>&1
if errorlevel 1 (
    echo ngrok non trouve. Installation...
    winget install ngrok -e --silent
    if errorlevel 1 (
        echo.
        echo Installation manuelle : https://ngrok.com/download
        pause
    )
)
echo ngrok installe !
pause

echo.
echo [ETAPE 4] Lancer ngrok
echo.
echo Dans un nouveau terminal, lancez :
echo    ngrok http 5078
echo.
echo Copiez l'URL (ex: https://abc123.ngrok.io)
echo.
set /p NGROK_URL="Collez l'URL ngrok ici: "

echo.
echo [ETAPE 5] Configurer le webhook Twilio
echo.
echo 1. Allez sur : https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
echo 2. Dans "WHEN A MESSAGE COMES IN" :
echo    - URL : %NGROK_URL%/api/messaging/whatsapp/webhook
echo    - HTTP POST
echo 3. Cliquez "Save"
echo.
pause

echo.
echo ========================================
echo   CONFIGURATION TERMINEE !
echo ========================================
echo.
echo TESTEZ MAINTENANT :
echo.
echo 1. Ouvrez WhatsApp sur votre telephone (0603983709)
echo 2. Envoyez un message a +1 415 523 8886
echo 3. Le message apparait dans MemoLib !
echo.
echo Verifiez sur : http://localhost:5078/demo.html
echo.
echo VOS CLIENTS PEUVENT AUSSI :
echo - Ajouter +1 415 523 8886 dans leurs contacts
echo - Envoyer "join [code]" pour se connecter
echo - Vous contacter via WhatsApp
echo - Tout remonte dans MemoLib !
echo.
pause

echo.
echo Voulez-vous ouvrir la console Twilio ? (O/N)
set /p open="Votre choix : "

if /i "%open%"=="O" (
    start https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
)

echo.
pause
