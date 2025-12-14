@echo off
echo ========================================
echo   Reinitialisation IAPosteManager
echo ========================================
echo.
echo ATTENTION : Cette operation va supprimer :
echo - Votre mot de passe maitre
echo - Vos identifiants Gmail sauvegardes
echo - Votre cle API OpenAI sauvegardee
echo - L'historique des emails
echo.
echo Vous devrez tout reconfigurer apres.
echo.
pause
echo.

echo Arret des serveurs en cours...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Sauvegarde de l'historique (si vous voulez le garder)...
if exist data\app.db (
    if not exist backup mkdir backup
    copy data\app.db backup\app.db_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%.bak >nul 2>&1
    echo [OK] Base de donnees sauvegardee dans backup\
)

echo.
echo Suppression des fichiers de configuration...
if exist data\credentials.enc del /F /Q data\credentials.enc
if exist data\openai_api.enc del /F /Q data\openai_api.enc
if exist data\salt.bin del /F /Q data\salt.bin
if exist data\metadata.json del /F /Q data\metadata.json

echo.
echo ========================================
echo   Reinitialisation terminee !
echo ========================================
echo.
echo Vous pouvez maintenant :
echo 1. Demarrer l'application : .\START_FULLSTACK.bat
echo 2. Aller sur http://localhost:3000
echo 3. Creer un NOUVEAU mot de passe maitre
echo 4. Reconfigurer Gmail dans Configuration
echo.
echo Note : L'historique des emails a ete sauvegarde
echo        dans le dossier backup\ si vous en avez besoin.
echo.
pause
