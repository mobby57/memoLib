@echo off
chcp 65001 > nul
cls

echo.
echo ================================================================
echo   🤖 TEST ASSISTANTS API COMPLET - IAPosteManager
echo ================================================================
echo.

REM Vérifier que Python est disponible
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

echo ✅ Python détecté
echo.

REM Vérifier que le fichier de test existe
if not exist "test_assistants_complete.py" (
    echo ❌ Fichier test_assistants_complete.py introuvable
    pause
    exit /b 1
)

echo ✅ Fichier de test trouvé
echo.

REM Vérifier la clé API OpenAI
if "%OPENAI_API_KEY%"=="" (
    echo ⚠️  OPENAI_API_KEY n'est pas définie
    echo.
    echo Définissez la variable d'environnement:
    echo set OPENAI_API_KEY=sk-proj-...
    echo.
    pause
    exit /b 1
)

echo ✅ Clé API OpenAI configurée
echo.

echo ================================================================
echo   🚀 LANCEMENT DES TESTS
echo ================================================================
echo.
echo Tests exécutés:
echo   1. Vector Stores API
echo   2. Assistants API
echo   3. Threads API
echo   4. Messages API
echo   5. Runs API
echo   6. Run Steps API
echo   7. Mise à jour
echo   8. Nettoyage
echo.
echo ⏳ Durée estimée: 30-60 secondes
echo.

pause

echo.
echo ================================================================
echo   EXÉCUTION...
echo ================================================================
echo.

REM Exécuter le test
python test_assistants_complete.py

if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo   ✅ TESTS TERMINÉS AVEC SUCCÈS!
    echo ================================================================
    echo.
    echo 📊 Prochaines étapes:
    echo    1. Consulter ASSISTANTS_COMPLETE_GUIDE.md
    echo    2. Intégrer dans votre flux email
    echo    3. Créer UI de gestion
    echo.
) else (
    echo.
    echo ================================================================
    echo   ❌ TESTS ÉCHOUÉS
    echo ================================================================
    echo.
    echo 🔍 Vérifications:
    echo    - Clé API OpenAI valide?
    echo    - Backend démarré (python src/backend/app.py)?
    echo    - Connexion Internet OK?
    echo.
    echo 📖 Consultez ASSISTANTS_COMPLETE_GUIDE.md section Troubleshooting
    echo.
)

pause
