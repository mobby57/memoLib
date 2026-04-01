@echo off
echo ========================================
echo   MEMOLIB - DEPLOIEMENT LOCAL
echo ========================================
echo.

cd publish

echo [1/3] Verification des fichiers...
if not exist MemoLib.Api.exe (
    echo ERREUR: MemoLib.Api.exe introuvable
    pause
    exit /b 1
)
echo OK - Tous les fichiers presents

echo.
echo [2/3] Configuration...
echo - Base de donnees: memolib.db
echo - Port: 5078
echo - Interface: http://localhost:5078

echo.
echo [3/3] Demarrage de l'application...
echo.
echo ========================================
echo   APPLICATION DEMARREE
echo ========================================
echo.
echo Acces:
echo   - API:     http://localhost:5078/api
echo   - Demo:    http://localhost:5078/demo.html
echo   - Sprint3: http://localhost:5078/sprint3-demo.html
echo   - Health:  http://localhost:5078/health
echo.
echo Appuyez sur Ctrl+C pour arreter
echo ========================================
echo.

MemoLib.Api.exe

pause
