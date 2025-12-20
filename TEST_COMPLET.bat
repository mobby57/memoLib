@echo off
echo 🚀 DEMARRAGE DES TESTS COMPLETS - IAPosteManager
echo ================================================

echo.
echo 📋 Verification des prerequis...

REM Vérifier Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python non trouvé
    echo 💡 Installez Python depuis https://python.org
    pause
    exit /b 1
)
echo ✅ Python installé

REM Vérifier les dépendances
echo 📦 Installation des dépendances de test...
pip install requests >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Erreur installation requests
)

echo.
echo 🔍 Vérification du serveur...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Serveur non accessible sur http://localhost:5000
    echo.
    echo 💡 DEMARREZ LE SERVEUR D'ABORD:
    echo    python src/backend/app.py
    echo.
    echo 🤔 Voulez-vous démarrer le serveur maintenant? (o/n)
    set /p choice=
    if /i "%choice%"=="o" (
        echo 🚀 Démarrage du serveur...
        start "IAPosteManager Server" python src/backend/app.py
        echo ⏳ Attente du démarrage du serveur (10 secondes)...
        timeout /t 10 /nobreak >nul
    )
    if /i not "%choice%"=="o" (
        echo ❌ Tests annulés - Démarrez le serveur manuellement
        pause
        exit /b 1
    )
)

echo.
echo 🧪 LANCEMENT DES TESTS...
echo ========================
python test_complet_local.py

echo.
echo 📊 Tests terminés !
echo.
echo 🌐 PAGES À TESTER MANUELLEMENT:
echo    http://localhost:5000/navigation.html
echo    http://localhost:5000/dashboard.html
echo    http://localhost:5000/ai-generator.html
echo    http://localhost:5000/accessibility.html
echo.
pause