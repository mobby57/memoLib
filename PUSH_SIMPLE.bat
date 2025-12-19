@echo off
echo ========================================
echo PUSH VERS GITHUB - iaPosteManager
echo ========================================
echo.

cd /d "%~dp0"

echo Creation du .gitignore...
echo # Python > .gitignore
echo __pycache__/ >> .gitignore
echo *.py[cod] >> .gitignore
echo venv/ >> .gitignore
echo .env >> .gitignore
echo *.db >> .gitignore
echo *.sqlite >> .gitignore
echo data/ >> .gitignore
echo logs/ >> .gitignore
echo *.log >> .gitignore
echo backups/ >> .gitignore
echo .vscode/ >> .gitignore
echo .idea/ >> .gitignore
echo node_modules/ >> .gitignore
echo *.pem >> .gitignore
echo *.key >> .gitignore

echo.
echo Initialisation Git...
git init
git config user.name "mooby865"
git config user.email "morosidibepro@gmail.com"

echo.
echo Ajout des fichiers...
git add .

echo.
echo Creation du commit...
git commit -m "Initial commit: iaPosteManager v3.6"

echo.
echo Configuration remote GitHub...
git remote add origin https://github.com/mooby865/iapostemanager.git
git branch -M main

echo.
echo ========================================
echo PUSH VERS GITHUB
echo ========================================
echo.
echo IMPORTANT: Utilisez votre Personal Access Token comme mot de passe
echo Token GitHub: https://github.com/settings/tokens
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ERREUR: Verifiez que:
    echo 1. Le repository existe sur GitHub
    echo 2. Vous utilisez le token comme mot de passe
    echo 3. Le token a les permissions repo et workflow
    pause
) else (
    echo.
    echo ========================================
    echo SUCCES! Projet sur GitHub
    echo ========================================
    echo.
    echo Voir sur: https://github.com/mooby865/iapostemanager
    pause
)