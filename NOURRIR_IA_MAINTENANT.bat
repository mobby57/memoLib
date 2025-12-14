@echo off
echo ================================================
echo ALIMENTATION MASSIVE DE VOTRE IA
echo ================================================
echo.
echo Demarrage du serveur pour nourrir l'IA...
echo.

cd /d "%~dp0"

REM Démarrer le serveur en arrière-plan
start /B python src\web\app.py

REM Attendre que le serveur démarre
timeout /t 5 /nobreak >nul

echo Alimentation de l'IA avec des centaines d'exemples...
echo.

REM Appeler l'API pour nourrir l'IA
curl -X POST http://127.0.0.1:5000/api/feed-ai-massive -H "Content-Type: application/json" -d "{}"

echo.
echo ================================================
echo IA NOURRIE AVEC SUCCES !
echo ================================================
echo.
echo Votre IA dispose maintenant de centaines d'exemples
echo pour generer des emails dans tous les styles.
echo.
echo Vous pouvez maintenant utiliser l'application :
echo http://127.0.0.1:5000/ia-personnalisee
echo.
pause