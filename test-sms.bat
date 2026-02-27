@echo off
chcp 65001 >nul
title Test Envoi SMS - MemoLib

echo.
echo ========================================
echo   TEST ENVOI SMS VIA MEMOLIB
echo ========================================
echo.

REM Configuration
set API_URL=http://localhost:5078
set /p NUMERO="Entrez le numero destinataire (+33XXXXXXXXX): "
set /p MESSAGE="Entrez votre message: "

echo.
echo 📱 Envoi SMS...
echo    Destinataire: %NUMERO%
echo    Message: %MESSAGE%
echo.

REM Créer le JSON
echo {"to":"%NUMERO%","body":"%MESSAGE%"} > temp_sms.json

REM Envoyer le SMS (nécessite authentification)
curl -X POST "%API_URL%/api/messaging/sms/send" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" ^
  -d @temp_sms.json

del temp_sms.json

echo.
echo.
echo ========================================
echo   VERIFICATION
echo ========================================
echo.
echo 1. Verifiez que le SMS a ete recu
echo 2. Si erreur 401: Vous devez vous authentifier d'abord
echo 3. Si erreur 400: Verifiez la configuration Twilio
echo.
echo POUR S'AUTHENTIFIER:
echo 1. Allez sur http://localhost:5078/demo.html
echo 2. Connectez-vous
echo 3. Recuperez le token JWT dans la console
echo.
pause
