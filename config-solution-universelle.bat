@echo off
chcp 65001 >nul
title Solution Universelle - SMS/WhatsApp vers Telegram

echo.
echo ========================================
echo   SOLUTION UNIVERSELLE MEMOLIB
echo   SMS + WhatsApp + Telegram
echo ========================================
echo.
echo PRINCIPE :
echo Client SMS/WhatsApp -^> Votre telephone -^> Telegram Bot -^> MemoLib
echo.
echo AVANTAGES :
echo - 100%% GRATUIT (pas de Twilio)
echo - Gardez votre numero 0603983709
echo - Un seul canal a gerer (Telegram)
echo - SMS + WhatsApp + Telegram unifies
echo.
pause

echo.
echo [ETAPE 1] Creer le bot Telegram
echo.
echo 1. Ouvrez Telegram sur votre telephone
echo 2. Cherchez : @BotFather
echo 3. Envoyez : /newbot
echo 4. Nom : MemoLib Cabinet
echo 5. Username : memolib_cabinet_bot
echo 6. Copiez le TOKEN
echo.
pause

set /p TOKEN="Collez le token Telegram ici: "
powershell -Command "dotnet user-secrets set 'Telegram:BotToken' '%TOKEN%'"

echo.
echo Token configure !
echo.

echo.
echo [ETAPE 2] Obtenir votre Chat ID
echo.
echo 1. Cherchez votre bot : @memolib_cabinet_bot
echo 2. Envoyez : /start
echo 3. Allez sur : https://api.telegram.org/bot%TOKEN%/getUpdates
echo 4. Cherchez "chat":{"id": XXXXXXX
echo 5. Copiez ce numero
echo.
pause

set /p CHATID="Collez votre Chat ID ici: "
powershell -Command "dotnet user-secrets set 'Telegram:AdminChatId' '%CHATID%'"

echo.
echo Chat ID configure !
echo.

echo.
echo [ETAPE 3] Installer l'app de transfert
echo.
echo ANDROID (RECOMMANDE) :
echo ----------------------
echo 1. Installez "SMS Forwarder" depuis Play Store
echo    https://play.google.com/store/apps/details?id=com.lomza.smsforwarder
echo.
echo 2. Ouvrez l'app
echo 3. Cliquez "+" pour ajouter une regle
echo 4. Condition : Tous les SMS
echo 5. Action : Telegram
echo 6. Bot Token : %TOKEN%
echo 7. Chat ID : %CHATID%
echo 8. Format : SMS de {sender}: {message}
echo 9. Activez la regle
echo.
echo IOS :
echo -----
echo 1. Ouvrez Shortcuts
echo 2. Automation : Message recu
echo 3. Action : Obtenir le contenu du message
echo 4. Action : Obtenir l'URL
echo    https://api.telegram.org/bot%TOKEN%/sendMessage?chat_id=%CHATID%^&text={message}
echo 5. Activez l'automation
echo.
pause

echo.
echo [ETAPE 4] Tester
echo.
echo 1. Envoyez-vous un SMS de test
echo 2. Le SMS doit apparaitre dans Telegram
echo 3. Le SMS doit apparaitre dans MemoLib
echo.
echo Verifiez sur : http://localhost:5078/demo.html
echo.
pause

echo.
echo ========================================
echo   CONFIGURATION TERMINEE !
echo ========================================
echo.
echo VOTRE CONFIGURATION :
echo - Bot : @memolib_cabinet_bot
echo - Token : %TOKEN%
echo - Chat ID : %CHATID%
echo.
echo TESTEZ :
echo 1. Envoyez un SMS a 0603983709
echo 2. Il arrive sur Telegram
echo 3. Il apparait dans MemoLib !
echo.
echo COUTS :
echo - SMS Forwarder : GRATUIT
echo - Telegram : GRATUIT
echo - MemoLib : GRATUIT
echo - Total : 0 euro !
echo.
echo vs Twilio : 0.08 euro/SMS = 80 euro pour 1000 SMS
echo.
pause

echo.
echo Voulez-vous ouvrir le guide complet ? (O/N)
set /p open="Votre choix : "

if /i "%open%"=="O" (
    start SOLUTION-UNIVERSELLE.md
)

echo.
pause
