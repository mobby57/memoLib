@echo off
echo ========================================
echo    NETTOYAGE AUTOMATIQUE IAPOSTEMANAGER
echo ========================================
echo.
echo ATTENTION: Ce script va supprimer 2.8GB de fichiers
echo Appuyez sur Ctrl+C pour annuler, ou
pause

echo.
echo === SUPPRESSION EN COURS ===
echo.

REM ===== ARCHIVES MASSIVES (2GB) =====
echo [1/6] Suppression archives massives...
if exist "archive" (
    rmdir /s /q "archive"
    echo ✅ archive/ supprime
) else (
    echo ⚠️  archive/ deja supprime
)

REM ===== DOUBLONS FRONTEND (500MB) =====
echo [2/6] Suppression doublons frontend...
if exist "frontend-react" (
    rmdir /s /q "frontend-react"
    echo ✅ frontend-react/ supprime
)
if exist "react-app" (
    rmdir /s /q "react-app"
    echo ✅ react-app/ supprime
)
if exist "mobile-app" (
    rmdir /s /q "mobile-app"
    echo ✅ mobile-app/ supprime
)

REM ===== PROJETS SEPARES (300MB) =====
echo [3/6] Suppression projets separes...
if exist "assistant_demarches" (
    rmdir /s /q "assistant_demarches"
    echo ✅ assistant_demarches/ supprime
)
if exist "chronology" (
    rmdir /s /q "chronology"
    echo ✅ chronology/ supprime
)
if exist "backup" (
    rmdir /s /q "backup"
    echo ✅ backup/ supprime
)

REM ===== SESSIONS TEMPORAIRES (200MB) =====
echo [4/6] Nettoyage sessions temporaires...
if exist "data\flask_session" (
    rmdir /s /q "data\flask_session"
    echo ✅ data/flask_session/ supprime
)
if exist "flask_session" (
    rmdir /s /q "flask_session"
    echo ✅ flask_session/ supprime
)

REM ===== DOSSIERS VIDES/INUTILES =====
echo [5/6] Suppression dossiers vides...
if exist "config" rmdir /s /q "config"
if exist "migrations" rmdir /s /q "migrations"
if exist "gui" rmdir /s /q "gui"
if exist "k8s" rmdir /s /q "k8s"
if exist "landing" rmdir /s /q "landing"
if exist "monitoring" rmdir /s /q "monitoring"
echo ✅ Dossiers vides supprimes

REM ===== NETTOYAGE TESTS REDONDANTS =====
echo [6/6] Nettoyage tests redondants...
for /d /r . %%d in (test-results) do (
    if exist "%%d" rmdir /s /q "%%d"
)
for /d /r . %%d in (playwright-report) do (
    if exist "%%d" rmdir /s /q "%%d"
)
echo ✅ Resultats tests supprimes

echo.
echo ========================================
echo           NETTOYAGE TERMINE
echo ========================================
echo.
echo ✅ Espace libere: ~2.8GB
echo ✅ Structure optimisee
echo ✅ Seuls les fichiers essentiels conserves
echo.
echo Structure finale:
echo   src/          - Code principal
echo   templates/    - Templates HTML/JSON
echo   static/       - Assets CSS/JS
echo   data/         - Donnees chiffrees (nettoyees)
echo   docs/         - Documentation
echo   tests/        - Tests unitaires
echo   docker-compose.yml - Orchestration
echo   requirements.txt   - Dependances
echo.
echo Vous pouvez maintenant utiliser:
echo   docker compose up --watch
echo.
pause