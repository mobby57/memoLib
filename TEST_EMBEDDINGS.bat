@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           TEST EMBEDDINGS OPENAI - IAPOSTEMANAGER          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Vérifier que Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

REM Vérifier que le fichier .env existe
if not exist ".env" (
    echo ❌ Fichier .env non trouvé
    echo    Créez un fichier .env avec votre clé OpenAI:
    echo    OPENAI_API_KEY=sk-proj-...
    pause
    exit /b 1
)

REM Vérifier que la clé OpenAI est configurée
findstr "OPENAI_API_KEY" .env >nul
if errorlevel 1 (
    echo ❌ OPENAI_API_KEY non trouvée dans .env
    echo    Ajoutez la ligne: OPENAI_API_KEY=sk-proj-...
    pause
    exit /b 1
)

echo ✓ Environnement prêt
echo.
echo ══════════════════════════════════════════════════════════════
echo.

REM Lancer le test
python test_embeddings.py

if errorlevel 1 (
    echo.
    echo ══════════════════════════════════════════════════════════════
    echo ❌ Tests échoués
    echo ══════════════════════════════════════════════════════════════
    pause
    exit /b 1
)

echo.
echo ══════════════════════════════════════════════════════════════
echo ✅ TOUS LES TESTS RÉUSSIS!
echo ══════════════════════════════════════════════════════════════
echo.
echo 📚 Consultez EMBEDDINGS_GUIDE.md pour plus d'informations
echo 🎨 Ouvrez semantic-search-demo.html pour la démo interactive
echo.

pause
