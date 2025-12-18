@echo off
chcp 65001 > nul
echo ========================================
echo 🚀 PUSH VERS GITHUB - iaPosteManager
echo ========================================
echo.

cd /d "%~dp0"

REM Vérifier si Git est installé
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git n'est pas installé!
    echo Téléchargez-le sur: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Créer .gitignore
echo 📝 Création du .gitignore...
(
echo # Python
echo __pycache__/
echo *.py[cod]
echo *.so
echo .Python
echo venv/
echo ENV/
echo *.egg-info/
echo.
echo # Node
echo node_modules/
echo.
echo # Environment
echo .env
echo .env.*
echo email-provisioning.env
echo config/email-config.env
echo.
echo # Database
echo *.db
echo *.sqlite
echo data/
echo.
echo # Logs
echo logs/
echo *.log
echo.
echo # Backups
echo backups/
echo.
echo # IDE
echo .vscode/
echo .idea/
echo.
echo # OS
echo .DS_Store
echo Thumbs.db
echo.
echo # Tests
echo playwright-report/
echo test-results/
echo.
echo # Secrets
echo *.pem
echo *.key
echo id_rsa*
) > .gitignore

REM Initialiser Git si nécessaire
if not exist .git (
    echo 🔧 Initialisation du repository Git...
    git init
    git config user.name "mooby865"
    echo ⚠️  Configurez votre email:
    set /p email="Entrez votre email GitHub: "
    git config user.email "%email%"
) else (
    echo ✅ Repository Git déjà initialisé
)

REM Ajouter les fichiers
echo 📦 Ajout des fichiers...
git add .

REM Commit
echo 💾 Création du commit...
git commit -m "Initial commit: iaPosteManager v3.6 - Production Ready with AI Email Generation"

REM Vérifier si le remote existe
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 🔗 Ajout du remote GitHub...
    git remote add origin https://github.com/mooby865/iapostemanager.git
) else (
    echo ✅ Remote GitHub déjà configuré
)

REM Renommer la branche en main
git branch -M main

REM Push vers GitHub
echo 🚀 Push vers GitHub...
echo.
echo ⚠️  Si demandé, utilisez votre Personal Access Token comme mot de passe
echo    (Créez-en un sur: https://github.com/settings/tokens)
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors du push!
    echo.
    echo Solutions possibles:
    echo 1. Créez le repository sur GitHub: https://github.com/new
    echo    Nom: iapostemanager
    echo    Ne pas initialiser avec README
    echo.
    echo 2. Générez un Personal Access Token:
    echo    https://github.com/settings/tokens
    echo    Cochez: repo, workflow
    echo.
    echo 3. Utilisez le token comme mot de passe lors du push
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ PROJET POUSSÉ SUR GITHUB!
echo ========================================
echo.
echo 🌐 Voir sur: https://github.com/mooby865/iapostemanager
echo.
echo Prochaines étapes:
echo 1. Configurer les secrets GitHub pour CI/CD
echo 2. Créer un token Docker Hub
echo 3. Le pipeline se déclenchera automatiquement!
echo.
pause
