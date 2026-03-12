@echo off
echo ========================================
echo   DEPLOIEMENT LOCAL - MemoLib
echo ========================================
echo.

echo [1/4] Compilation du projet...
dotnet build --configuration Release
if %errorlevel% neq 0 (
    echo ERREUR: Compilation echouee
    pause
    exit /b 1
)

echo.
echo [2/4] Verification base de donnees...
if not exist "memolib.db" (
    echo Creation de la base de donnees...
    dotnet ef database update
)

echo.
echo [3/4] Demarrage de l'application...
echo.
echo ========================================
echo   APPLICATION DEMARREE
echo ========================================
echo.
echo   API:       http://localhost:5078
echo   Interface: http://localhost:5078/demo-refactored.html
echo   Swagger:   http://localhost:5078/swagger
echo.
echo Appuyez sur Ctrl+C pour arreter
echo ========================================
echo.

dotnet run --no-build --configuration Release
