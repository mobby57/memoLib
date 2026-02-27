@echo off
chcp 65001 >nul
title Configuration Messenger MemoLib

echo.
echo ========================================
echo   CONFIGURATION MESSENGER MEMOLIB
echo ========================================
echo.
echo AVANTAGES :
echo - 60%% des Francais utilisent Messenger
echo - GRATUIT (API Facebook)
echo - Simple a configurer
echo - Professionnel
echo.
pause

echo.
echo [ETAPE 1] Creer une page Facebook (5 min)
echo.
echo 1. Allez sur : https://www.facebook.com/pages/create
echo 2. Nom : Cabinet MemoLib
echo 3. Categorie : Services juridiques
echo 4. Creez la page
echo.
pause

echo.
echo [ETAPE 2] Creer une app Facebook (5 min)
echo.
echo 1. Allez sur : https://developers.facebook.com/apps
echo 2. Cliquez "Creer une app"
echo 3. Type : Business
echo 4. Nom : MemoLib Messenger
echo 5. Creez l'app
echo.
pause

echo.
echo [ETAPE 3] Configurer Messenger
echo.
echo 1. Dans votre app, ajoutez "Messenger"
echo 2. Allez dans Messenger ^> Parametres
echo 3. Section "Jetons d'acces" :
echo    - Selectionnez votre page
echo    - Cliquez "Generer un jeton"
echo    - COPIEZ le jeton
echo.
pause

set /p PAGE_TOKEN="Collez le Page Access Token ici: "
powershell -Command "dotnet user-secrets set 'Messenger:PageAccessToken' '%PAGE_TOKEN%'"

echo.
echo Token configure !
echo.

echo.
echo [ETAPE 4] Configurer le webhook
echo.
echo 1. Installez ngrok : winget install ngrok
echo 2. Lancez : ngrok http 5078
echo 3. Copiez l'URL : https://xxxx.ngrok.io
echo.
set /p NGROK_URL="Collez l'URL ngrok ici: "

echo.
echo 4. Generez un token de verification :
set VERIFY_TOKEN=%RANDOM%%RANDOM%%RANDOM%
powershell -Command "dotnet user-secrets set 'Messenger:VerifyToken' '%VERIFY_TOKEN%'"

echo.
echo 5. Dans Facebook Developers :
echo    - Messenger ^> Parametres ^> Webhooks
echo    - URL de rappel : %NGROK_URL%/api/messenger/webhook
echo    - Jeton de verification : %VERIFY_TOKEN%
echo    - Champs : messages, messaging_postbacks
echo    - Verifier et enregistrer
echo.
pause

echo.
echo [ETAPE 5] Abonner la page
echo.
echo 1. Dans Webhooks, cliquez "Ajouter un abonnement"
echo 2. Selectionnez votre page
echo 3. Abonnez-vous
echo.
pause

echo.
echo ========================================
echo   CONFIGURATION TERMINEE !
echo ========================================
echo.
echo TESTEZ MAINTENANT :
echo.
echo 1. Allez sur votre page Facebook
echo 2. Cliquez "Envoyer un message"
echo 3. Envoyez : "Test MemoLib"
echo 4. Le message apparait dans MemoLib !
echo.
echo Verifiez sur : http://localhost:5078/demo.html
echo.
echo VOS CLIENTS PEUVENT :
echo - Chercher votre page Facebook
echo - Envoyer des messages Messenger
echo - Tout remonte dans MemoLib !
echo.
pause

echo.
echo Voulez-vous ouvrir Facebook Developers ? (O/N)
set /p open="Votre choix : "

if /i "%open%"=="O" (
    start https://developers.facebook.com/apps
)

echo.
pause
