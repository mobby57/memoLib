@echo off
chcp 65001 >nul
title MemoLib - Démonstration Commerciale Interactive

color 0A
echo.
echo  ███╗   ███╗███████╗███╗   ███╗ ██████╗ ██╗     ██╗██████╗ 
echo  ████╗ ████║██╔════╝████╗ ████║██╔═══██╗██║     ██║██╔══██╗
echo  ██╔████╔██║█████╗  ██╔████╔██║██║   ██║██║     ██║██████╔╝
echo  ██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║██║   ██║██║     ██║██╔══██╗
echo  ██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║╚██████╔╝███████╗██║██████╔╝
echo  ╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝╚═════╝ 
echo.
color 07
echo 🎯 DEMONSTRATION COMMERCIALE INTERACTIVE
echo ========================================
echo.
echo Bienvenue dans la démonstration de MemoLib !
echo La solution complète de gestion d'emails pour cabinets d'avocats.
echo.
echo 💼 PROBLEMES RESOLUS :
echo ✅ Emails perdus dans Outlook
echo ✅ Clients non suivis  
echo ✅ Dossiers éparpillés
echo ✅ Recherche impossible
echo ✅ Pas de traçabilité
echo ✅ Workflow chaotique
echo.
echo 🚀 SOLUTION MEMOLIB :
echo ✅ Scan automatique Gmail/Outlook
echo ✅ Création auto des dossiers
echo ✅ IA pour recherche intelligente
echo ✅ Templates de réponses
echo ✅ Analytics avancés
echo ✅ Audit complet
echo.
pause

:MENU
cls
echo.
echo 🎯 MENU DEMONSTRATION MEMOLIB
echo =============================
echo.
echo Choisissez la démonstration :
echo.
echo 1. 📧 Scan automatique d'emails (2 min)
echo 2. 🤖 Recherche intelligente IA (1 min)  
echo 3. 📁 Création automatique de dossiers (1 min)
echo 4. 📊 Analytics et rapports (1 min)
echo 5. ⚠️  Gestion des anomalies (1 min)
echo 6. 📝 Templates et réponses auto (1 min)
echo 7. 🎬 DEMO COMPLETE (10 min)
echo 8. 💰 Présentation commerciale
echo 9. 🚀 Lancer l'interface web
echo 0. Quitter
echo.
set /p choice="Votre choix (0-9) : "

if "%choice%"=="1" goto DEMO_SCAN
if "%choice%"=="2" goto DEMO_IA
if "%choice%"=="3" goto DEMO_DOSSIERS
if "%choice%"=="4" goto DEMO_ANALYTICS
if "%choice%"=="5" goto DEMO_ANOMALIES
if "%choice%"=="6" goto DEMO_TEMPLATES
if "%choice%"=="7" goto DEMO_COMPLETE
if "%choice%"=="8" goto PRESENTATION
if "%choice%"=="9" goto LAUNCH_WEB
if "%choice%"=="0" goto END
goto MENU

:DEMO_SCAN
cls
echo.
echo 📧 DEMONSTRATION : SCAN AUTOMATIQUE D'EMAILS
echo ============================================
echo.
echo 🎯 SCENARIO : Cabinet reçoit 50 emails/jour
echo.
echo ⏱️  AVANT MEMOLIB :
echo ❌ 2h/jour à trier manuellement
echo ❌ Emails perdus dans Outlook  
echo ❌ Clients non identifiés
echo ❌ Dossiers non créés
echo.
echo ✅ AVEC MEMOLIB :
echo ✅ Scan automatique toutes les 60 secondes
echo ✅ Détection automatique des clients
echo ✅ Création automatique des dossiers
echo ✅ Extraction des coordonnées
echo.
echo 🚀 DEMONSTRATION EN DIRECT...
echo.
curl -s -X POST "http://localhost:5078/api/email-scan/manual" -H "Authorization: Bearer demo" | findstr "totalEmails\|ingested\|duplicates" 2>nul || echo ⚠️ API non démarrée - Lancez d'abord MemoLib
echo.
echo 💰 GAIN DE TEMPS : 2h/jour → 5min/jour
echo 💰 GAIN FINANCIER : 400€/mois économisés
echo.
pause
goto MENU

:DEMO_IA
cls
echo.
echo 🤖 DEMONSTRATION : RECHERCHE INTELLIGENTE IA
echo ============================================
echo.
echo 🎯 SCENARIO : Retrouver tous les dossiers "divorce"
echo.
echo ⏱️  AVANT MEMOLIB :
echo ❌ Fouiller dans Outlook 30 minutes
echo ❌ Recherche par mots-clés limitée
echo ❌ Emails similaires non trouvés
echo.
echo ✅ AVEC MEMOLIB :
echo ✅ Recherche sémantique IA
echo ✅ Trouve même sans mots exacts
echo ✅ Regroupe les doublons
echo ✅ Résultats en 2 secondes
echo.
echo 🚀 DEMONSTRATION EN DIRECT...
echo.
echo Recherche : "problème conjugal"
curl -s -X POST "http://localhost:5078/api/semantic/search" -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d "{\"query\":\"problème conjugal\"}" 2>nul | findstr "similarity\|text" || echo ⚠️ API non démarrée
echo.
echo 💰 GAIN DE TEMPS : 30min → 2 secondes
echo 💰 TAUX DE RETROUVAILLE : 60% → 95%
echo.
pause
goto MENU

:DEMO_DOSSIERS
cls
echo.
echo 📁 DEMONSTRATION : CREATION AUTOMATIQUE DE DOSSIERS
echo ==================================================
echo.
echo 🎯 SCENARIO : Email client reçu à 9h00
echo.
echo ⏱️  AVANT MEMOLIB :
echo ❌ Lire l'email manuellement
echo ❌ Créer le dossier dans le système
echo ❌ Saisir les coordonnées client
echo ❌ Classer l'email
echo ❌ Temps total : 15 minutes
echo.
echo ✅ AVEC MEMOLIB :
echo ✅ Email scanné automatiquement
echo ✅ Client détecté et créé
echo ✅ Dossier créé automatiquement
echo ✅ Coordonnées extraites
echo ✅ Temps total : 0 seconde
echo.
echo 🚀 DEMONSTRATION EN DIRECT...
echo.
echo Simulation email client...
curl -s -X POST "http://localhost:5078/api/ingest/email" -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d "{\"from\":\"client.demo@example.com\",\"subject\":\"Demande de conseil juridique\",\"body\":\"Bonjour Maître, j'ai besoin de vos conseils pour un litige.\",\"externalId\":\"DEMO-%RANDOM%\"}" 2>nul | findstr "caseId\|clientId" || echo ⚠️ API non démarrée
echo.
echo 💰 GAIN DE TEMPS : 15min → 0 seconde
echo 💰 GAIN PAR EMAIL : 12,50€ économisés
echo.
pause
goto MENU

:DEMO_ANALYTICS
cls
echo.
echo 📊 DEMONSTRATION : ANALYTICS ET RAPPORTS
echo ========================================
echo.
echo 🎯 SCENARIO : Bilan mensuel du cabinet
echo.
echo ⏱️  AVANT MEMOLIB :
echo ❌ Compter manuellement les emails
echo ❌ Excel pour faire les graphiques
echo ❌ Pas de vue d'ensemble
echo ❌ Temps : 2 heures/mois
echo.
echo ✅ AVEC MEMOLIB :
echo ✅ Dashboard temps réel
echo ✅ Statistiques automatiques
echo ✅ Graphiques intégrés
echo ✅ Export PDF/Excel
echo ✅ Temps : 30 secondes
echo.
echo 🚀 DEMONSTRATION EN DIRECT...
echo.
curl -s -X GET "http://localhost:5078/api/dashboard/overview" -H "Authorization: Bearer demo" 2>nul | findstr "totalCases\|totalClients\|totalEvents" || echo ⚠️ API non démarrée
echo.
echo 💰 GAIN DE TEMPS : 2h/mois → 30 secondes
echo 💰 GAIN ANNUEL : 1000€ économisés
echo.
pause
goto MENU

:DEMO_ANOMALIES
cls
echo.
echo ⚠️ DEMONSTRATION : GESTION DES ANOMALIES
echo ========================================
echo.
echo 🎯 SCENARIO : Emails avec problèmes
echo.
echo ⏱️  AVANT MEMOLIB :
echo ❌ Anomalies non détectées
echo ❌ Doublons non identifiés
echo ❌ Emails perdus
echo ❌ Pas de contrôle qualité
echo.
echo ✅ AVEC MEMOLIB :
echo ✅ Détection automatique des anomalies
echo ✅ Centre de contrôle centralisé
echo ✅ Actions correctives proposées
echo ✅ Audit complet
echo.
echo 🚀 DEMONSTRATION EN DIRECT...
echo.
curl -s -X GET "http://localhost:5078/api/alerts/center" -H "Authorization: Bearer demo" 2>nul | findstr "totalOpenAnomalies\|flag" || echo ⚠️ API non démarrée
echo.
echo 💰 EMAILS SAUVES : 95% des anomalies détectées
echo 💰 QUALITE : +200% d'amélioration
echo.
pause
goto MENU

:DEMO_TEMPLATES
cls
echo.
echo 📝 DEMONSTRATION : TEMPLATES ET REPONSES AUTO
echo =============================================
echo.
echo 🎯 SCENARIO : Répondre à un client
echo.
echo ⏱️  AVANT MEMOLIB :
echo ❌ Rédiger chaque réponse manuellement
echo ❌ Chercher les bons termes juridiques
echo ❌ Temps : 15 minutes/email
echo.
echo ✅ AVEC MEMOLIB :
echo ✅ IA génère la réponse automatiquement
echo ✅ Termes juridiques appropriés
echo ✅ Personnalisation automatique
echo ✅ Temps : 30 secondes
echo.
echo 🚀 DEMONSTRATION EN DIRECT...
echo.
echo Génération réponse pour "demande de conseil divorce"...
curl -s -X POST "http://localhost:5078/api/templates/generate" -H "Content-Type: application/json" -H "Authorization: Bearer demo" -d "{\"clientContext\":\"Client demande conseil divorce\",\"subject\":\"Demande conseil\",\"caseType\":\"famille\"}" 2>nul | findstr "generatedResponse" || echo ⚠️ API non démarrée
echo.
echo 💰 GAIN DE TEMPS : 15min → 30 secondes
echo 💰 GAIN PAR REPONSE : 12€ économisés
echo.
pause
goto MENU

:DEMO_COMPLETE
cls
echo.
echo 🎬 DEMONSTRATION COMPLETE MEMOLIB
echo =================================
echo.
echo Cette démonstration va montrer un workflow complet :
echo 1. Réception d'emails clients
echo 2. Scan et analyse automatique
echo 3. Création des dossiers
echo 4. Recherche intelligente
echo 5. Génération de réponses
echo 6. Analytics et reporting
echo.
echo Durée estimée : 10 minutes
echo.
pause
call test-complet.bat
pause
goto MENU

:PRESENTATION
cls
echo.
echo 💰 PRESENTATION COMMERCIALE MEMOLIB
echo ===================================
echo.
echo 🎯 CIBLE : Cabinets d'avocats 1-50 avocats
echo.
echo 💸 PROBLEMES COÛTEUX ACTUELS :
echo ❌ 2h/jour perdues à trier les emails = 400€/mois
echo ❌ 15min/email pour créer un dossier = 12,50€/email
echo ❌ 30min pour retrouver un ancien email = 25€/recherche
echo ❌ 2h/mois pour les rapports = 100€/mois
echo ❌ TOTAL PERDU : 1000€/mois minimum
echo.
echo ✅ SOLUTION MEMOLIB :
echo ✅ Scan automatique : 0€ (automatisé)
echo ✅ Création dossiers : 0€ (automatisé)  
echo ✅ Recherche IA : 2 secondes (0,10€)
echo ✅ Rapports auto : 30 secondes (2€)
echo ✅ TOTAL ECONOMISE : 950€/mois
echo.
echo 💰 TARIFICATION :
echo 📦 STARTER : 29€/mois (1 avocat)
echo 📦 CABINET : 49€/mois (5 avocats)
echo 📦 PREMIUM : 99€/mois (20 avocats)
echo.
echo 🎯 ROI : 950€ économisés - 49€ payés = 901€/mois de bénéfice
echo 🎯 ROI ANNUEL : 10 812€ économisés
echo 🎯 RETOUR SUR INVESTISSEMENT : 1800%%
echo.
echo 🚀 PROPOSITION :
echo ✅ 30 jours d'essai gratuit
echo ✅ Installation incluse
echo ✅ Formation incluse
echo ✅ Support 7j/7
echo ✅ Garantie satisfait ou remboursé
echo.
pause
goto MENU

:LAUNCH_WEB
cls
echo.
echo 🚀 LANCEMENT DE L'INTERFACE WEB
echo ==============================
echo.
echo Ouverture de MemoLib dans votre navigateur...
start http://localhost:5078/demo.html
echo.
echo ✅ Interface ouverte !
echo.
echo 🎯 POUR LA DEMO :
echo 1. Créez un compte test
echo 2. Cliquez sur "Initialiser base démo"
echo 3. Explorez toutes les fonctionnalités
echo 4. Testez la recherche IA
echo 5. Consultez les analytics
echo.
pause
goto MENU

:END
cls
echo.
echo 🎉 MERCI D'AVOIR TESTE MEMOLIB !
echo ===============================
echo.
echo 📞 CONTACT COMMERCIAL :
echo 📧 Email : contact@memolib.com
echo 📱 Tél : +33 1 23 45 67 89
echo 🌐 Web : https://memolib.com
echo.
echo 🚀 PRÊT À REVOLUTIONNER VOTRE CABINET ?
echo.
pause
exit