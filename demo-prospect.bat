@echo off
title MemoLib - Demo Prospect

echo.
echo ========================================
echo    MEMOLIB - DEMO POUR PROSPECTS
echo ========================================
echo.
echo Bienvenue dans la demonstration de MemoLib !
echo La solution complete de gestion d'emails pour cabinets d'avocats.
echo.
echo PROBLEMES RESOLUS :
echo - Emails perdus dans Outlook
echo - Clients non suivis  
echo - Dossiers eparpilles
echo - Recherche impossible
echo - Pas de tracabilite
echo - Workflow chaotique
echo.
echo SOLUTION MEMOLIB :
echo - Scan automatique Gmail/Outlook
echo - Creation auto des dossiers
echo - IA pour recherche intelligente
echo - Templates de reponses
echo - Analytics avances
echo - Audit complet
echo.
pause

:MENU
cls
echo.
echo MENU DEMONSTRATION MEMOLIB
echo ==========================
echo.
echo Choisissez la demonstration :
echo.
echo 1. Scan automatique d'emails (2 min)
echo 2. Recherche intelligente IA (1 min)  
echo 3. Creation automatique de dossiers (1 min)
echo 4. Analytics et rapports (1 min)
echo 5. Gestion des anomalies (1 min)
echo 6. Templates et reponses auto (1 min)
echo 7. PRESENTATION COMMERCIALE
echo 8. Lancer l'interface web
echo 0. Quitter
echo.
set /p choice="Votre choix (0-8) : "

if "%choice%"=="1" goto DEMO_SCAN
if "%choice%"=="2" goto DEMO_IA
if "%choice%"=="3" goto DEMO_DOSSIERS
if "%choice%"=="4" goto DEMO_ANALYTICS
if "%choice%"=="5" goto DEMO_ANOMALIES
if "%choice%"=="6" goto DEMO_TEMPLATES
if "%choice%"=="7" goto PRESENTATION
if "%choice%"=="8" goto LAUNCH_WEB
if "%choice%"=="0" goto END
goto MENU

:DEMO_SCAN
cls
echo.
echo DEMONSTRATION : SCAN AUTOMATIQUE D'EMAILS
echo ==========================================
echo.
echo SCENARIO : Cabinet recoit 50 emails/jour
echo.
echo AVANT MEMOLIB :
echo - 2h/jour a trier manuellement
echo - Emails perdus dans Outlook  
echo - Clients non identifies
echo - Dossiers non crees
echo.
echo AVEC MEMOLIB :
echo - Scan automatique toutes les 60 secondes
echo - Detection automatique des clients
echo - Creation automatique des dossiers
echo - Extraction des coordonnees
echo.
echo DEMONSTRATION EN DIRECT...
echo.
curl -s -X POST "http://localhost:5078/api/email-scan/manual" -H "Authorization: Bearer demo" 2>nul || echo API non demarree - Lancez d'abord MemoLib
echo.
echo GAIN DE TEMPS : 2h/jour vers 5min/jour
echo GAIN FINANCIER : 400 euros/mois economies
echo.
pause
goto MENU

:DEMO_IA
cls
echo.
echo DEMONSTRATION : RECHERCHE INTELLIGENTE IA
echo ==========================================
echo.
echo SCENARIO : Retrouver tous les dossiers "divorce"
echo.
echo AVANT MEMOLIB :
echo - Fouiller dans Outlook 30 minutes
echo - Recherche par mots-cles limitee
echo - Emails similaires non trouves
echo.
echo AVEC MEMOLIB :
echo - Recherche semantique IA
echo - Trouve meme sans mots exacts
echo - Regroupe les doublons
echo - Resultats en 2 secondes
echo.
echo DEMONSTRATION EN DIRECT...
echo.
echo Recherche : "probleme conjugal"
curl -s -X POST "http://localhost:5078/api/semantic/search" -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d "{\"query\":\"probleme conjugal\"}" 2>nul || echo API non demarree
echo.
echo GAIN DE TEMPS : 30min vers 2 secondes
echo TAUX DE RETROUVAILLE : 60 pourcent vers 95 pourcent
echo.
pause
goto MENU

:DEMO_DOSSIERS
cls
echo.
echo DEMONSTRATION : CREATION AUTOMATIQUE DE DOSSIERS
echo =================================================
echo.
echo SCENARIO : Email client recu a 9h00
echo.
echo AVANT MEMOLIB :
echo - Lire l'email manuellement
echo - Creer le dossier dans le systeme
echo - Saisir les coordonnees client
echo - Classer l'email
echo - Temps total : 15 minutes
echo.
echo AVEC MEMOLIB :
echo - Email scanne automatiquement
echo - Client detecte et cree
echo - Dossier cree automatiquement
echo - Coordonnees extraites
echo - Temps total : 0 seconde
echo.
echo DEMONSTRATION EN DIRECT...
echo.
echo Simulation email client...
curl -s -X POST "http://localhost:5078/api/ingest/email" -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d "{\"from\":\"client.demo@example.com\",\"subject\":\"Demande de conseil juridique\",\"body\":\"Bonjour Maitre, j'ai besoin de vos conseils pour un litige.\",\"externalId\":\"DEMO-%RANDOM%\"}" 2>nul || echo API non demarree
echo.
echo GAIN DE TEMPS : 15min vers 0 seconde
echo GAIN PAR EMAIL : 12,50 euros economies
echo.
pause
goto MENU

:DEMO_ANALYTICS
cls
echo.
echo DEMONSTRATION : ANALYTICS ET RAPPORTS
echo ======================================
echo.
echo SCENARIO : Bilan mensuel du cabinet
echo.
echo AVANT MEMOLIB :
echo - Compter manuellement les emails
echo - Excel pour faire les graphiques
echo - Pas de vue d'ensemble
echo - Temps : 2 heures/mois
echo.
echo AVEC MEMOLIB :
echo - Dashboard temps reel
echo - Statistiques automatiques
echo - Graphiques integres
echo - Export PDF/Excel
echo - Temps : 30 secondes
echo.
echo DEMONSTRATION EN DIRECT...
echo.
curl -s -X GET "http://localhost:5078/api/dashboard/overview" -H "Authorization: Bearer demo" 2>nul || echo API non demarree
echo.
echo GAIN DE TEMPS : 2h/mois vers 30 secondes
echo GAIN ANNUEL : 1000 euros economies
echo.
pause
goto MENU

:DEMO_ANOMALIES
cls
echo.
echo DEMONSTRATION : GESTION DES ANOMALIES
echo ======================================
echo.
echo SCENARIO : Emails avec problemes
echo.
echo AVANT MEMOLIB :
echo - Anomalies non detectees
echo - Doublons non identifies
echo - Emails perdus
echo - Pas de controle qualite
echo.
echo AVEC MEMOLIB :
echo - Detection automatique des anomalies
echo - Centre de controle centralise
echo - Actions correctives proposees
echo - Audit complet
echo.
echo DEMONSTRATION EN DIRECT...
echo.
curl -s -X GET "http://localhost:5078/api/alerts/center" -H "Authorization: Bearer demo" 2>nul || echo API non demarree
echo.
echo EMAILS SAUVES : 95 pourcent des anomalies detectees
echo QUALITE : +200 pourcent d'amelioration
echo.
pause
goto MENU

:DEMO_TEMPLATES
cls
echo.
echo DEMONSTRATION : TEMPLATES ET REPONSES AUTO
echo ===========================================
echo.
echo SCENARIO : Repondre a un client
echo.
echo AVANT MEMOLIB :
echo - Rediger chaque reponse manuellement
echo - Chercher les bons termes juridiques
echo - Temps : 15 minutes/email
echo.
echo AVEC MEMOLIB :
echo - IA genere la reponse automatiquement
echo - Termes juridiques appropries
echo - Personnalisation automatique
echo - Temps : 30 secondes
echo.
echo DEMONSTRATION EN DIRECT...
echo.
echo Generation reponse pour "demande de conseil divorce"...
curl -s -X POST "http://localhost:5078/api/templates/generate" -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d "{\"clientContext\":\"Client demande conseil divorce\",\"subject\":\"Demande conseil\",\"caseType\":\"famille\"}" 2>nul || echo API non demarree
echo.
echo GAIN DE TEMPS : 15min vers 30 secondes
echo GAIN PAR REPONSE : 12 euros economies
echo.
pause
goto MENU

:PRESENTATION
cls
echo.
echo PRESENTATION COMMERCIALE MEMOLIB
echo =================================
echo.
echo CIBLE : Cabinets d'avocats 1-50 avocats
echo.
echo PROBLEMES COUTEUX ACTUELS :
echo - 2h/jour perdues a trier les emails = 400 euros/mois
echo - 15min/email pour creer un dossier = 12,50 euros/email
echo - 30min pour retrouver un ancien email = 25 euros/recherche
echo - 2h/mois pour les rapports = 100 euros/mois
echo - TOTAL PERDU : 1000 euros/mois minimum
echo.
echo SOLUTION MEMOLIB :
echo - Scan automatique : 0 euros (automatise)
echo - Creation dossiers : 0 euros (automatise)  
echo - Recherche IA : 2 secondes (0,10 euros)
echo - Rapports auto : 30 secondes (2 euros)
echo - TOTAL ECONOMISE : 950 euros/mois
echo.
echo TARIFICATION :
echo - STARTER : 29 euros/mois (1 avocat)
echo - CABINET : 49 euros/mois (5 avocats)
echo - PREMIUM : 99 euros/mois (20 avocats)
echo.
echo ROI : 950 euros economies - 49 euros payes = 901 euros/mois de benefice
echo ROI ANNUEL : 10 812 euros economies
echo RETOUR SUR INVESTISSEMENT : 1800 pourcent
echo.
echo PROPOSITION :
echo - 30 jours d'essai gratuit
echo - Installation incluse
echo - Formation incluse
echo - Support 7j/7
echo - Garantie satisfait ou rembourse
echo.
pause
goto MENU

:LAUNCH_WEB
cls
echo.
echo LANCEMENT DE L'INTERFACE WEB
echo =============================
echo.
echo Ouverture de MemoLib dans votre navigateur...
start http://localhost:5078/demo.html
echo.
echo Interface ouverte !
echo.
echo POUR LA DEMO :
echo 1. Creez un compte test
echo 2. Cliquez sur "Initialiser base demo"
echo 3. Explorez toutes les fonctionnalites
echo 4. Testez la recherche IA
echo 5. Consultez les analytics
echo.
pause
goto MENU

:END
cls
echo.
echo MERCI D'AVOIR TESTE MEMOLIB !
echo ==============================
echo.
echo CONTACT COMMERCIAL :
echo Email : contact@memolib.com
echo Tel : +33 1 23 45 67 89
echo Web : https://memolib.com
echo.
echo PRET A REVOLUTIONNER VOTRE CABINET ?
echo.
pause
exit