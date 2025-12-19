@echo off
REM ============================================================================
REM DEPLOY TO RENDER.COM - AUTOMATIC DEPLOYMENT SCRIPT
REM ============================================================================
REM This script automates the deployment process to Render.com
REM ============================================================================

color 0A
title Deploy to Render.com - iaPosteManager

echo.
echo ============================================================================
echo           RENDER.COM AUTOMATIC DEPLOYMENT - iaPosteManager
echo ============================================================================
echo.

REM Check if Git is available
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git n'est pas installe ou n'est pas dans le PATH!
    echo Installez Git: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [STEP 1/6] Verification de l'etat du depot Git...
echo ============================================================================

git status
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ce n'est pas un depot Git valide!
    pause
    exit /b 1
)

echo.
echo [STEP 2/6] Verification de la branche...
echo ============================================================================

git branch --show-current
set CURRENT_BRANCH=
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

if not "%CURRENT_BRANCH%"=="main" (
    echo [WARNING] Vous n'etes pas sur la branche 'main' (branche actuelle: %CURRENT_BRANCH%)
    echo.
    choice /C YN /M "Voulez-vous passer a la branche 'main' "
    if errorlevel 2 (
        echo [INFO] Deploiement annule.
        pause
        exit /b 0
    )
    git checkout main
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Impossible de passer a la branche 'main'!
        pause
        exit /b 1
    )
)

echo.
echo [STEP 3/6] Verification des fichiers requis...
echo ============================================================================

if not exist "render.yaml" (
    echo [ERROR] render.yaml n'existe pas!
    pause
    exit /b 1
)
echo [OK] render.yaml trouve

if not exist "requirements.txt" (
    echo [ERROR] requirements.txt n'existe pas!
    pause
    exit /b 1
)
echo [OK] requirements.txt trouve

if not exist "build.sh" (
    echo [ERROR] build.sh n'existe pas!
    pause
    exit /b 1
)
echo [OK] build.sh trouve

if not exist "start.sh" (
    echo [ERROR] start.sh n'existe pas!
    pause
    exit /b 1
)
echo [OK] start.sh trouve

echo.
echo [STEP 4/6] Ajout et commit des changements...
echo ============================================================================

git add .
git diff-index --quiet HEAD
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Changements detectes, creation du commit...
    set /p COMMIT_MSG="Message de commit [Auto-deploy to Render.com]: "
    if "%COMMIT_MSG%"=="" set COMMIT_MSG=Auto-deploy to Render.com
    
    git commit -m "%COMMIT_MSG%"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Echec du commit!
        pause
        exit /b 1
    )
    echo [OK] Commit cree avec succes
) else (
    echo [INFO] Aucun changement a committer
)

echo.
echo [STEP 5/6] Push vers GitHub...
echo ============================================================================

git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Echec du push vers GitHub!
    echo Verifiez vos credentials et votre connexion internet.
    pause
    exit /b 1
)
echo [OK] Push vers GitHub reussi!

echo.
echo [STEP 6/6] Instructions de deploiement sur Render.com...
echo ============================================================================
echo.

color 0B
echo  DEPLOIEMENT GITHUB REUSSI! 
echo.
color 0A

echo Votre code est maintenant sur GitHub: https://github.com/mobby57/iapm.com
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║         ETAPES POUR DEPLOYER SUR RENDER.COM                          ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.
echo 1. Ouvrir dans le navigateur:
echo    https://render.com
echo.
echo 2. Se connecter avec GitHub:
echo    - Cliquez sur "Sign Up" ou "Log In"
echo    - Choisissez "Continue with GitHub"
echo    - Autorisez Render a acceder a vos repos
echo.
echo 3. Creer un nouveau Blueprint:
echo    - Dans le Dashboard, cliquez sur "New +"
echo    - Selectionnez "Blueprint"
echo    - Choisissez le repo: mobby57/iapm.com
echo    - Render detectera automatiquement render.yaml
echo.
echo 4. Appliquer le Blueprint:
echo    - Verifiez la configuration affichee
echo    - Cliquez sur "Apply"
echo    - Attendez 3-5 minutes pour le deploiement
echo.
echo 5. Tester votre application:
echo    - URL: https://iapostemanager.onrender.com
echo    - Health check: https://iapostemanager.onrender.com/api/health
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║         CONFIGURATION ACTUELLE                                        ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.
echo Service:        iapostemanager
echo Region:         Frankfurt (EU)
echo Plan:           Free (750h/mois)
echo Runtime:        Python 3
echo Branch:         main
echo Auto-deploy:    Enabled (deploie automatiquement a chaque push)
echo Health check:   /api/health
echo Persistent disk: 1GB (pour SQLite)
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║         FONCTIONNALITES INCLUSES                                      ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.
echo  Flask + SocketIO (WebSocket support)
echo  Rate limiting (Flask-Limiter)
echo  Session management
echo  TTS/Accessibilite (pyttsx3 + espeak)
echo  Speech recognition
echo  Tests complets (pytest + playwright)
echo  Monitoring (Prometheus)
echo  Stockage d'objets (MinIO)
echo  IA integration (OpenAI)
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║         APRES LE DEPLOIEMENT                                          ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.
echo - Auto-deploy actif: Chaque push sur 'main' deploie automatiquement
echo - Logs accessibles: Dashboard Render.com  votre service  Logs
echo - Shell acces: Dashboard  votre service  Shell
echo - Metriques: Dashboard  votre service  Metrics
echo - Variables d'env: Dashboard  votre service  Environment
echo.
echo ╔═══════════════════════════════════════════════════════════════════════╗
echo ║         COMMANDES UTILES                                              ║
echo ╚═══════════════════════════════════════════════════════════════════════╝
echo.
echo Pour deployer des changements futurs:
echo    1. Modifiez votre code localement
echo    2. Executez: .\DEPLOY_RENDER.bat
echo    3. Render deploie automatiquement!
echo.
echo Pour forcer un redeploy sans changements:
echo    - Dashboard  votre service  Manual Deploy  Deploy latest commit
echo.
echo Pour voir les logs en temps reel:
echo    - Dashboard  votre service  Logs
echo.

color 0B
echo.
echo  PRET POUR LE DEPLOIEMENT! 
echo.
echo Ouvrez maintenant: https://render.com
echo.
color 07

pause
