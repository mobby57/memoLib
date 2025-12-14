@echo off
echo ========================================
echo  SecureVault v2.1 - Demarrage Docker
echo  Mode Watch - Synchronisation Auto
echo ========================================
echo.

REM Vérifier si Docker est installé
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas installe ou n'est pas dans le PATH
    echo Installez Docker Desktop depuis: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker detecte
echo.

REM Vérifier Docker Compose
docker compose version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker Compose n'est pas disponible
    pause
    exit /b 1
)

echo [OK] Docker Compose detecte
echo.

REM Vérifier si .env existe
if not exist .env (
    echo [INFO] Creation du fichier .env depuis .env.example
    copy .env.example .env >nul
    echo [!] Pensez a configurer vos variables dans .env
    echo.
)

echo ========================================
echo  Demarrage avec Watch Mode Active
echo ========================================
echo.
echo Les modifications de code seront synchronisees automatiquement
echo Flask rechargera automatiquement en mode debug
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.
echo Acces : http://localhost:5000
echo.

docker compose up --watch
docker-compose build

echo.
echo [3/4] Démarrage des services...
docker-compose up -d

echo.
echo [4/4] Vérification des conteneurs...
docker-compose ps

echo.
echo ========================================
echo   Application démarrée avec succès!
echo ========================================
echo.
echo URLs disponibles:
echo   - Application: http://localhost:5000
echo   - MinIO Console: http://localhost:9001
echo   - MailHog: http://localhost:8025
echo.
echo Commandes utiles:
echo   - Voir les logs: docker-compose logs -f app
echo   - Arrêter: docker-compose down
echo   - Redémarrer: docker-compose restart
echo.
pause
