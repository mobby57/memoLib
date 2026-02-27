@echo off
chcp 65001 >nul
title Signal Command Center - MemoLib

echo.
echo ========================================
echo   SIGNAL COMMAND CENTER
echo   Pilotez TOUT depuis Signal !
echo ========================================
echo.
echo POURQUOI SIGNAL ?
echo - Securite MAXIMALE (chiffrement E2E)
echo - Parfait pour avocats (secret professionnel)
echo - GRATUIT illimite
echo - Interface de commande simple
echo.
pause

echo.
echo [ETAPE 1] Installer signal-cli (5 min)
echo.
echo Windows :
echo 1. Installez Java : winget install Oracle.JavaRuntimeEnvironment
echo 2. Telechargez signal-cli : https://github.com/AsamK/signal-cli/releases
echo 3. Decompressez dans C:\signal-cli
echo 4. Ajoutez au PATH
echo.
echo Linux/Mac :
echo sudo apt install signal-cli
echo.
pause

echo.
echo [ETAPE 2] Enregistrer votre numero (5 min)
echo.
echo 1. Ouvrez un terminal
echo 2. Enregistrez votre numero :
echo    signal-cli -u +33603983709 register
echo 3. Recevez le code par SMS
echo 4. Verifiez :
echo    signal-cli -u +33603983709 verify CODE
echo.
pause

set /p PHONE="Entrez votre numero Signal (+33603983709): "
powershell -Command "dotnet user-secrets set 'Signal:PhoneNumber' '%PHONE%'"

echo.
echo Numero configure !
echo.

echo.
echo [ETAPE 3] Lancer signal-cli en mode daemon
echo.
echo 1. Lancez le daemon :
echo    signal-cli -u %PHONE% daemon --http 127.0.0.1:8080
echo.
echo 2. Le daemon ecoute sur http://localhost:8080
echo.
powershell -Command "dotnet user-secrets set 'Signal:CliUrl' 'http://localhost:8080'"

echo.
echo Daemon configure !
echo.
pause

echo.
echo [ETAPE 4] Configurer le webhook
echo.
echo 1. Installez ngrok : winget install ngrok
echo 2. Lancez : ngrok http 5078
echo 3. Copiez l'URL : https://xxxx.ngrok.io
echo.
set /p NGROK_URL="Collez l'URL ngrok ici: "

echo.
echo 4. Configurez signal-cli pour envoyer vers MemoLib :
echo    curl -X POST http://localhost:8080/v1/receive/%PHONE% \
echo      -d '{"webhook": "%NGROK_URL%/api/signal/webhook"}'
echo.
pause

echo.
echo ========================================
echo   CONFIGURATION TERMINEE !
echo ========================================
echo.
echo COMMANDES DISPONIBLES :
echo.
echo /help - Aide
echo /inbox - Voir les messages
echo /send telegram 123 Bonjour - Envoyer
echo /stats - Statistiques
echo /cases - Dossiers
echo /search divorce - Rechercher
echo /status - Etat systeme
echo.
echo TESTEZ MAINTENANT :
echo.
echo 1. Ouvrez Signal sur votre telephone
echo 2. Envoyez-vous un message : /help
echo 3. Vous recevez la liste des commandes !
echo.
echo EXEMPLES :
echo - /inbox
echo - /send messenger 789 RDV confirme
echo - /search contrat
echo - /stats
echo.
pause

echo.
echo ========================================
echo   SIGNAL = CENTRE DE CONTROLE
echo ========================================
echo.
echo DEPUIS SIGNAL, VOUS POUVEZ :
echo.
echo 1. Voir TOUS les messages (inbox unifiee)
echo 2. Envoyer sur N'IMPORTE QUEL canal
echo 3. Chercher dans TOUTE la base
echo 4. Voir les statistiques
echo 5. Gerer les dossiers
echo.
echo SECURITE :
echo - Chiffrement end-to-end
echo - Aucune donnee sur serveur tiers
echo - Parfait pour secret professionnel
echo.
echo GRATUIT :
echo - Pas de cout par message
echo - Illimite
echo - Open source
echo.
pause

echo.
echo Voulez-vous ouvrir le guide signal-cli ? (O/N)
set /p open="Votre choix : "

if /i "%open%"=="O" (
    start https://github.com/AsamK/signal-cli
)

echo.
pause
