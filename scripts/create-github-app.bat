@echo off
setlocal enabledelayedexpansion

REM Script automatisé pour créer une GitHub App avec GitHub CLI (Windows)
REM Usage: scripts\create-github-app.bat

echo 🚀 Création automatique de la GitHub App - IA Poste Manager

REM Variables de configuration
set "APP_NAME=IA Poste Manager"
set "DESCRIPTION=Assistant juridique digital CESEDA - Gestion sécurisée multi-tenant"
set "HOMEPAGE_URL=https://your-domain.com"
set "CALLBACK_URL=https://your-domain.com/api/auth/callback/github"
set "WEBHOOK_URL=https://your-domain.com/api/webhooks/github"

REM Générer le secret webhook
for /f %%i in ('node -e "console.log('whsec_' + require('crypto').randomBytes(32).toString('hex'))"') do set "WEBHOOK_SECRET=%%i"
echo 🔑 Secret webhook généré: !WEBHOOK_SECRET!

REM Créer le fichier de configuration temporaire
(
echo {
echo   "name": "!APP_NAME!",
echo   "description": "!DESCRIPTION!",
echo   "url": "!HOMEPAGE_URL!",
echo   "callback_urls": ["!CALLBACK_URL!"],
echo   "webhook_url": "!WEBHOOK_URL!",
echo   "webhook_secret": "!WEBHOOK_SECRET!",
echo   "public": true,
echo   "default_permissions": {
echo     "contents": "write",
echo     "issues": "write",
echo     "metadata": "read",
echo     "pull_requests": "write"
echo   },
echo   "default_events": [
echo     "issues",
echo     "issue_comment",
echo     "pull_request",
echo     "pull_request_review",
echo     "push",
echo     "repository"
echo   ]
echo }
) > %TEMP%\github-app-config.json

REM Créer la GitHub App
echo 📱 Création de la GitHub App...
gh api --method POST -H "Accept: application/vnd.github+json" /user/apps --input %TEMP%\github-app-config.json > %TEMP%\app-response.json

REM Extraire les informations importantes (nécessite jq pour Windows)
for /f %%i in ('jq -r ".id" %TEMP%\app-response.json') do set "APP_ID=%%i"
for /f %%i in ('jq -r ".client_id" %TEMP%\app-response.json') do set "CLIENT_ID=%%i"
for /f %%i in ('jq -r ".slug" %TEMP%\app-response.json') do set "APP_SLUG=%%i"

echo ✅ GitHub App créée avec succès!
echo 📋 App ID: !APP_ID!
echo 📋 Client ID: !CLIENT_ID!
echo 📋 App Slug: !APP_SLUG!

REM Générer une clé privée
echo 🔐 Génération de la clé privée...
gh api --method POST -H "Accept: application/vnd.github+json" /apps/!APP_ID!/private-keys > %TEMP%\private-key-response.json

REM Sauvegarder la clé privée
jq -r ".key" %TEMP%\private-key-response.json > github-app-private-key.pem

REM Créer le client secret
echo 🔒 Génération du client secret...
gh api --method POST -H "Accept: application/vnd.github+json" /apps/!APP_ID!/client-secrets > %TEMP%\client-secret-response.json

for /f %%i in ('jq -r ".client_secret" %TEMP%\client-secret-response.json') do set "CLIENT_SECRET=%%i"

REM Convertir la clé en base64 (Windows)
for /f %%i in ('certutil -encode github-app-private-key.pem %TEMP%\temp.txt ^& findstr /v CERTIFICATE %TEMP%\temp.txt') do set "PRIVATE_KEY_BASE64=%%i"

REM Générer NextAuth secret
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set "NEXTAUTH_SECRET=%%i"

REM Créer le fichier .env.local
(
echo # GitHub App Configuration ^(Généré automatiquement^)
echo GITHUB_APP_ID=!APP_ID!
echo GITHUB_CLIENT_ID=!CLIENT_ID!
echo GITHUB_CLIENT_SECRET=!CLIENT_SECRET!
echo GITHUB_PRIVATE_KEY="!PRIVATE_KEY_BASE64!"
echo WEBHOOK_SECRET=!WEBHOOK_SECRET!
echo.
echo # NextAuth Configuration
echo NEXTAUTH_URL=https://your-domain.com
echo NEXTAUTH_SECRET=!NEXTAUTH_SECRET!
echo.
echo # Database
echo DATABASE_URL="postgresql://username:password@localhost:5432/iapostemanage"
) > .env.local

echo 📄 Fichier .env.local créé avec toutes les variables

REM URL d'installation
set "INSTALL_URL=https://github.com/apps/!APP_SLUG!/installations/new"
echo 🌐 Ouvrir ce lien pour installer l'app: !INSTALL_URL!

REM Nettoyer les fichiers temporaires
del %TEMP%\github-app-config.json %TEMP%\app-response.json %TEMP%\private-key-response.json %TEMP%\client-secret-response.json %TEMP%\temp.txt 2>nul

echo.
echo 🎉 Configuration terminée!
echo.
echo 📋 Résumé:
echo    - App ID: !APP_ID!
echo    - Client ID: !CLIENT_ID!
echo    - Clé privée: .\github-app-private-key.pem
echo    - Variables d'environnement: .\.env.local
echo.
echo 📌 Prochaines étapes:
echo    1. Installer l'app: !INSTALL_URL!
echo    2. Configurer votre domaine dans .env.local
echo    3. Démarrer l'application: npm run dev
echo.

pause