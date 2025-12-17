@echo off
chcp 65001 > nul
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║                   TEST MENU INTERACTIF                        ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo   Ce script teste si les menus fonctionnent correctement.
echo.

:menu
echo.
echo ════════════════════════════════════════════════════════════════
echo   MENU DE TEST
echo ════════════════════════════════════════════════════════════════
echo.
echo   1. Option 1 - Afficher un message
echo   2. Option 2 - Afficher l'heure
echo   3. Option 3 - Compter jusqu'a 5
echo   4. Quitter
echo.
set /p "choix=Votre choix (1-4): "

if "%choix%"=="1" (
    echo.
    echo [INFO] Vous avez choisi l'option 1!
    echo.
    pause
    cls
    goto :menu
)

if "%choix%"=="2" (
    echo.
    echo [INFO] Heure actuelle: %time%
    echo.
    pause
    cls
    goto :menu
)

if "%choix%"=="3" (
    echo.
    echo [INFO] Comptage:
    for /l %%i in (1,1,5) do (
        echo   %%i...
        timeout /t 1 /nobreak > nul
    )
    echo   Termine!
    echo.
    pause
    cls
    goto :menu
)

if "%choix%"=="4" (
    echo.
    echo [INFO] Au revoir!
    timeout /t 2 /nobreak > nul
    exit /b 0
)

echo.
echo [ERREUR] Choix invalide! Veuillez choisir entre 1 et 4.
echo.
pause
cls
goto :menu
