@echo off
chcp 65001 >nul
title Configuration Telegram MemoLib

echo.
echo ========================================
echo   CONFIGURATION TELEGRAM MEMOLIB
echo ========================================
echo.
echo AVANTAGES :
echo - 100%% GRATUIT (pas de sandbox)
echo - Pas de webhook ngrok necessaire
echo - API simple et puissante
echo - Fichiers jusqu'a 2GB
echo - Groupes pour equipes
echo.
pause

echo.
echo [ETAPE 1] Creer un bot Telegram (2 minutes)
echo.
echo 1. Ouvrez Telegram sur votre telephone
echo 2. Cherchez : @BotFather
echo 3. Envoyez : /newbot
echo 4. Nom du bot : MemoLib Cabinet
echo 5. Username : memolib_cabinet_bot (doit finir par _bot)
echo 6. Copiez le TOKEN qui apparait
echo.
pause

echo.
echo [ETAPE 2] Configurer le token (SECURISE)
echo.
set /p TOKEN="Collez le token Telegram ici: "

powershell -Command "dotnet user-secrets set 'Telegram:BotToken' '%TOKEN%'"

echo.
echo Token configure de maniere securisee !
echo.
pause

echo.
echo [ETAPE 3] Configurer le webhook
echo.
echo Option A : AVEC ngrok (pour production)
echo ------------------------------------------
echo 1. Installez ngrok : winget install ngrok
echo 2. Lancez : ngrok http 5078
echo 3. Copiez l'URL : https://xxxx.ngrok.io
echo 4. Configurez :
echo    curl -X POST https://api.telegram.org/bot%TOKEN%/setWebhook?url=https://xxxx.ngrok.io/api/telegram/webhook
echo.
echo Option B : SANS ngrok (polling - plus simple)
echo ----------------------------------------------
echo Pas besoin de webhook !
echo Le bot recupere les messages automatiquement.
echo (A implementer avec getUpdates)
echo.
pause

echo.
echo [ETAPE 4] Tester le bot
echo.
echo 1. Cherchez votre bot dans Telegram : @memolib_cabinet_bot
echo 2. Cliquez "Start" ou envoyez /start
echo 3. Envoyez un message : "Test MemoLib"
echo 4. Le message apparait dans MemoLib !
echo.
echo Verifiez sur : http://localhost:5078/demo.html
echo.
pause

echo.
echo ========================================
echo   CONFIGURATION TERMINEE !
echo ========================================
echo.
echo VOTRE BOT : @memolib_cabinet_bot
echo.
echo VOS CLIENTS PEUVENT :
echo - Chercher @memolib_cabinet_bot
echo - Envoyer des messages
echo - Envoyer des fichiers
echo - Tout remonte dans MemoLib !
echo.
echo AVANTAGES :
echo - Gratuit illimite
echo - Pas de cout par message
echo - Professionnel
echo - Securise
echo.
pause
