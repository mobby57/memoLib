@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🔍 VERIFICATION COMPLETE - IAPosteManager     ║
echo ║                        Version 2.2                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Variables
set "ERROR_COUNT=0"
set "SUCCESS_COUNT=0"
set "LOG_FILE=verification_log.txt"

:: Initialiser le log
echo [%date% %time%] === VERIFICATION COMPLETE === > %LOG_FILE%

echo 📋 Démarrage de la vérification complète...
echo.

:: ============================================================================
:: 1. VERIFICATION STRUCTURE PROJET
:: ============================================================================
echo ┌─ 1. STRUCTURE PROJET
call :check_folder "src" "Dossier source principal"
call :check_folder "src\backend" "Backend Flask"
call :check_folder "src\frontend" "Frontend React"
call :check_folder "docs" "Documentation"
call :check_folder "tests" "Tests"
call :check_folder "data" "Données"
call :check_folder "docker" "Configuration Docker"
call :check_folder "deploy" "Scripts déploiement"

:: ============================================================================
:: 2. VERIFICATION FICHIERS CRITIQUES
:: ============================================================================
echo.
echo ┌─ 2. FICHIERS CRITIQUES
call :check_file "src\backend\app.py" "Application Flask principale"
call :check_file "src\frontend\package.json" "Configuration React"
call :check_file "requirements.txt" "Dépendances Python"
call :check_file "docker-compose.yml" "Configuration Docker"
call :check_file "README.md" "Documentation principale"
call :check_file ".env.example" "Template environnement"

:: ============================================================================
:: 3. VERIFICATION PYTHON
:: ============================================================================
echo.
echo ┌─ 3. ENVIRONNEMENT PYTHON
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
    call :success "Python installé: !PYTHON_VERSION!"
) else (
    call :error "Python non installé ou non accessible"
)

:: Vérifier pip
pip --version >nul 2>&1
if %errorlevel% equ 0 (
    call :success "pip disponible"
) else (
    call :error "pip non disponible"
)

:: ============================================================================
:: 4. VERIFICATION NODE.JS
:: ============================================================================
echo.
echo ┌─ 4. ENVIRONNEMENT NODE.JS
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1" %%i in ('node --version 2^>^&1') do set NODE_VERSION=%%i
    call :success "Node.js installé: !NODE_VERSION!"
) else (
    call :error "Node.js non installé"
)

:: Vérifier npm
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1" %%i in ('npm --version 2^>^&1') do set NPM_VERSION=%%i
    call :success "npm disponible: !NPM_VERSION!"
) else (
    call :error "npm non disponible"
)

:: ============================================================================
:: 5. VERIFICATION DEPENDANCES PYTHON
:: ============================================================================
echo.
echo ┌─ 5. DEPENDANCES PYTHON
if exist "requirements.txt" (
    echo    Vérification des dépendances Python...
    python -c "import flask" >nul 2>&1
    if %errorlevel% equ 0 (
        call :success "Flask installé"
    ) else (
        call :error "Flask manquant"
    )
    
    python -c "import openai" >nul 2>&1
    if %errorlevel% equ 0 (
        call :success "OpenAI SDK installé"
    ) else (
        call :error "OpenAI SDK manquant"
    )
    
    python -c "import requests" >nul 2>&1
    if %errorlevel% equ 0 (
        call :success "Requests installé"
    ) else (
        call :error "Requests manquant"
    )
) else (
    call :error "requirements.txt manquant"
)

:: ============================================================================
:: 6. VERIFICATION DEPENDANCES NODE.JS
:: ============================================================================
echo.
echo ┌─ 6. DEPENDANCES NODE.JS
if exist "src\frontend\package.json" (
    cd src\frontend
    if exist "node_modules" (
        call :success "node_modules présent"
    ) else (
        call :error "node_modules manquant - Exécuter: npm install"
    )
    cd ..\..
) else (
    call :error "package.json manquant"
)

:: ============================================================================
:: 7. VERIFICATION CONFIGURATION
:: ============================================================================
echo.
echo ┌─ 7. CONFIGURATION
if exist ".env" (
    call :success "Fichier .env présent"
    
    :: Vérifier les variables critiques
    findstr /C:"OPENAI_API_KEY" .env >nul 2>&1
    if %errorlevel% equ 0 (
        call :success "OPENAI_API_KEY configuré"
    ) else (
        call :error "OPENAI_API_KEY manquant dans .env"
    )
    
    findstr /C:"SECRET_KEY" .env >nul 2>&1
    if %errorlevel% equ 0 (
        call :success "SECRET_KEY configuré"
    ) else (
        call :error "SECRET_KEY manquant dans .env"
    )
) else (
    call :error "Fichier .env manquant - Copier depuis .env.example"
)

:: ============================================================================
:: 8. VERIFICATION BASE DE DONNEES
:: ============================================================================
echo.
echo ┌─ 8. BASE DE DONNEES
if exist "data\unified.db" (
    call :success "Base de données unified.db présente"
) else (
    call :warning "Base de données sera créée au premier démarrage"
)

if exist "data\users.db" (
    call :success "Base utilisateurs présente"
) else (
    call :warning "Base utilisateurs sera créée automatiquement"
)

:: ============================================================================
:: 9. VERIFICATION PORTS
:: ============================================================================
echo.
echo ┌─ 9. PORTS DISPONIBLES
netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    call :warning "Port 5000 (Backend) occupé"
) else (
    call :success "Port 5000 (Backend) disponible"
)

netstat -an | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    call :warning "Port 3001 (Frontend) occupé"
) else (
    call :success "Port 3001 (Frontend) disponible"
)

:: ============================================================================
:: 10. VERIFICATION DOCKER (optionnel)
:: ============================================================================
echo.
echo ┌─ 10. DOCKER (optionnel)
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('docker --version 2^>^&1') do set DOCKER_VERSION=%%i
    call :success "Docker installé: !DOCKER_VERSION!"
    
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        call :success "Docker Compose disponible"
    ) else (
        call :warning "Docker Compose non disponible"
    )
) else (
    call :warning "Docker non installé (optionnel)"
)

:: ============================================================================
:: 11. TEST RAPIDE BACKEND
:: ============================================================================
echo.
echo ┌─ 11. TEST BACKEND
echo    Test de syntaxe Python...
python -m py_compile src\backend\app.py >nul 2>&1
if %errorlevel% equ 0 (
    call :success "Syntaxe backend valide"
) else (
    call :error "Erreur syntaxe backend"
)

:: ============================================================================
:: 12. TEST RAPIDE FRONTEND
:: ============================================================================
echo.
echo ┌─ 12. TEST FRONTEND
if exist "src\frontend\package.json" (
    cd src\frontend
    npm run build --dry-run >nul 2>&1
    if %errorlevel% equ 0 (
        call :success "Configuration build frontend valide"
    ) else (
        call :warning "Problème configuration build frontend"
    )
    cd ..\..
)

:: ============================================================================
:: 13. VERIFICATION SECURITE
:: ============================================================================
echo.
echo ┌─ 13. SECURITE
if exist "data\credentials.enc" (
    call :success "Credentials chiffrés présents"
) else (
    call :warning "Credentials chiffrés seront créés au premier usage"
)

if exist "data\salt.bin" (
    call :success "Salt cryptographique présent"
) else (
    call :warning "Salt sera généré automatiquement"
)

:: ============================================================================
:: 14. VERIFICATION TESTS
:: ============================================================================
echo.
echo ┌─ 14. TESTS
if exist "src\frontend\tests" (
    call :success "Dossier tests E2E présent"
) else (
    call :error "Dossier tests E2E manquant"
)

if exist "tests" (
    call :success "Dossier tests unitaires présent"
) else (
    call :error "Dossier tests unitaires manquant"
)

:: ============================================================================
:: RESUME FINAL
:: ============================================================================
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                        📊 RESUME FINAL                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ✅ Succès: %SUCCESS_COUNT%
echo ❌ Erreurs: %ERROR_COUNT%
echo ⚠️  Avertissements: (voir détails ci-dessus)
echo.

if %ERROR_COUNT% equ 0 (
    echo 🎉 TOUT EST OK! Le projet est prêt à être démarré.
    echo.
    echo 🚀 Pour démarrer:
    echo    1. Backend:  python src\backend\app.py
    echo    2. Frontend: cd src\frontend ^&^& npm run dev
    echo.
    echo 📖 Ou utilisez: DEMARRER.bat
) else (
    echo ⚠️  PROBLEMES DETECTES! Corrigez les erreurs avant de continuer.
    echo.
    echo 🔧 Actions recommandées:
    if %ERROR_COUNT% gtr 0 (
        echo    - Installer les dépendances manquantes
        echo    - Configurer le fichier .env
        echo    - Vérifier la structure du projet
    )
)

echo.
echo 📝 Log détaillé: %LOG_FILE%
echo ⏰ Vérification terminée: %date% %time%
echo.
pause
goto :eof

:: ============================================================================
:: FONCTIONS UTILITAIRES
:: ============================================================================

:check_folder
if exist "%~1" (
    call :success "%~2"
) else (
    call :error "%~2 manquant: %~1"
)
goto :eof

:check_file
if exist "%~1" (
    call :success "%~2"
) else (
    call :error "%~2 manquant: %~1"
)
goto :eof

:success
echo    ✅ %~1
echo [%time%] SUCCESS: %~1 >> %LOG_FILE%
set /a SUCCESS_COUNT+=1
goto :eof

:error
echo    ❌ %~1
echo [%time%] ERROR: %~1 >> %LOG_FILE%
set /a ERROR_COUNT+=1
goto :eof

:warning
echo    ⚠️  %~1
echo [%time%] WARNING: %~1 >> %LOG_FILE%
goto :eof