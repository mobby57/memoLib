@echo off
chcp 65001 >nul
title Guide Création Compte Twilio

echo.
echo ========================================
echo   CREATION COMPTE TWILIO - 5 MINUTES
echo ========================================
echo.
echo ETAPE 1 : INSCRIPTION (2 min)
echo ==============================
echo.
echo 1. Ouvrez votre navigateur
echo 2. Allez sur : https://www.twilio.com/try-twilio
echo 3. Remplissez le formulaire :
echo    - Prenom / Nom
echo    - Email : %USERNAME%@gmail.com
echo    - Mot de passe (fort)
echo 4. Cliquez "Start your free trial"
echo 5. Verifiez votre email
echo.
pause

echo.
echo ETAPE 2 : VERIFICATION TELEPHONE (1 min)
echo =========================================
echo.
echo 1. Twilio va vous demander votre numero
echo 2. Entrez : +33 6 XX XX XX XX
echo 3. Recevez le code par SMS
echo 4. Entrez le code de verification
echo.
pause

echo.
echo ETAPE 3 : RECUPERER VOS IDENTIFIANTS (1 min)
echo =============================================
echo.
echo 1. Vous etes sur le Dashboard Twilio
echo 2. Notez ces informations :
echo.
echo    Account SID : ACxxxxxxxxxxxxxxxxxxxxxxxxxx
echo    Auth Token  : [Cliquez sur "Show" pour voir]
echo.
echo 3. COPIEZ CES VALEURS !
echo.
pause

echo.
echo ETAPE 4 : OBTENIR UN NUMERO (1 min)
echo ====================================
echo.
echo POUR SMS :
echo ----------
echo 1. Menu : Phone Numbers ^> Manage ^> Buy a number
echo 2. Pays : France (+33)
echo 3. Capabilities : Cochez "SMS"
echo 4. Search
echo 5. Buy (1 euro/mois)
echo.
echo POUR WHATSAPP (GRATUIT) :
echo -------------------------
echo 1. Menu : Messaging ^> Try it out ^> Send a WhatsApp message
echo 2. Numero sandbox : +1 415 523 8886
echo 3. Depuis WhatsApp, envoyez : join [code affiche]
echo 4. C'est pret !
echo.
pause

echo.
echo ETAPE 5 : CONFIGURER MEMOLIB (SECURISE)
echo ============================================
echo.
echo METHODE SECURISEE - USER SECRETS
echo (Identifiants HORS du code source)
echo.
echo Ouvrez PowerShell dans MemoLib.Api et executez :
echo.
echo dotnet user-secrets set "Twilio:AccountSid" "VOTRE_ACCOUNT_SID"
echo dotnet user-secrets set "Twilio:AuthToken" "VOTRE_AUTH_TOKEN"
echo dotnet user-secrets set "Twilio:PhoneNumber" "+33XXXXXXXXX"
echo dotnet user-secrets set "Twilio:WhatsAppNumber" "+14155238886"
echo.
echo AVANTAGES :
echo - Identifiants JAMAIS dans le code
echo - JAMAIS dans Git
echo - Securite maximale
echo - Facile a changer
echo.
pause

echo.
echo ETAPE 6 : CONFIGURER WEBHOOKS
echo ==============================
echo.
echo POUR TESTER EN LOCAL :
echo ----------------------
echo 1. Installez ngrok : https://ngrok.com/download
echo 2. Lancez : ngrok http 5078
echo 3. Copiez l'URL : https://xxxx.ngrok.io
echo.
echo DANS TWILIO :
echo -------------
echo 1. Phone Numbers ^> Manage ^> Active numbers
echo 2. Cliquez sur votre numero
echo 3. Messaging Configuration :
echo    - A MESSAGE COMES IN : Webhook
echo    - URL : https://xxxx.ngrok.io/api/messaging/sms/webhook
echo    - HTTP POST
echo 4. Save
echo.
echo POUR WHATSAPP :
echo ---------------
echo 1. Messaging ^> Settings ^> WhatsApp Sandbox
echo 2. WHEN A MESSAGE COMES IN :
echo    - URL : https://xxxx.ngrok.io/api/messaging/whatsapp/webhook
echo    - HTTP POST
echo 3. Save
echo.
pause

echo.
echo ETAPE 7 : CHECK RAPIDE (1 min)
echo ===============================
echo.
echo 1. Verifiez que MemoLib tourne sur le port 5078
echo    - Ouvrez : http://localhost:5078/health
echo.
echo 2. Verifiez que ngrok expose bien l'URL publique
echo    - Ouvrez : http://127.0.0.1:4040/api/tunnels
echo    - L'URL https doit etre la meme que dans Twilio
echo.
echo 3. Faites un test reel
echo    - Envoyez un SMS vers votre numero Twilio
echo    - Ou envoyez un message WhatsApp au sandbox
echo.
echo 4. Resultat attendu
echo    - Le message apparait dans MemoLib
echo    - Pas d'erreur 404 dans Twilio Console ^> Monitor ^> Logs
echo.
pause

echo.
echo ========================================
echo   CONFIGURATION TERMINEE !
echo ========================================
echo.
echo CREDIT GRATUIT : 15 USD
echo.
echo TARIFS :
echo - SMS reception : 0.0075 euro/SMS
echo - SMS envoi : 0.08 euro/SMS
echo - WhatsApp : 0.005 euro/message
echo - Numero : 1 euro/mois
echo.
echo TESTEZ MAINTENANT :
echo 1. Redemarrez MemoLib
echo 2. Envoyez un SMS a votre numero Twilio
echo 3. Le message apparait dans MemoLib !
echo.
echo BESOIN D'AIDE ?
echo - Doc Twilio : https://www.twilio.com/docs
echo - Support : https://support.twilio.com
echo.
pause

echo.
echo Voulez-vous ouvrir Twilio maintenant ? (O/N)
set /p open="Votre choix : "

if /i "%open%"=="O" (
    start https://www.twilio.com/try-twilio
    echo.
    echo Navigateur ouvert !
    echo Suivez les etapes ci-dessus.
)

echo.
echo Appuyez sur une touche pour fermer...
pause >nul
