@echo off
echo ========================================
echo FIX OPENAI API KEY - IAPosteManager
echo ========================================

echo.
echo PROBLEME DETECTE: Cle API OpenAI invalide
echo.
echo SOLUTIONS:
echo.
echo 1. Obtenir une cle valide sur:
echo    https://platform.openai.com/account/api-keys
echo.
echo 2. Configurer dans .env:
echo    OPENAI_API_KEY=sk-proj-VOTRE_CLE_COMPLETE
echo.
echo 3. Ou via l'interface web:
echo    - Demarrer: python src\backend\app.py
echo    - Aller sur: http://localhost:5000
echo    - Settings ^> Credentials
echo.

set /p key="Entrez votre cle OpenAI (ou ENTER pour passer): "

if not "%key%"=="" (
    echo OPENAI_API_KEY=%key% >> .env
    echo Cle ajoutee au fichier .env
    echo.
    echo Relancez maintenant: .\TEST_ASSISTANTS.bat
) else (
    echo Configuration manuelle requise
    echo Editez le fichier .env avec votre cle
)

echo.
pause