@echo off
chcp 65001 >nul
title Demarrage ngrok

echo.
echo Installation et demarrage ngrok...
echo.

where ngrok >nul 2>&1
if errorlevel 1 (
    echo ngrok non trouve. Installation...
    winget install ngrok -e --silent
    if errorlevel 1 (
        echo.
        echo [ERREUR] Installation echouee
        echo Installez manuellement : https://ngrok.com/download
        pause
        exit /b 1
    )
)

echo.
echo Demarrage ngrok sur port 5078...
echo.
echo COPIEZ L'URL QUI APPARAIT (https://xxxx.ngrok.io)
echo.
echo Puis configurez dans Twilio :
echo https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
echo.
echo Webhook URL : [URL_NGROK]/api/messaging/sms/webhook
echo.

ngrok http 5078
