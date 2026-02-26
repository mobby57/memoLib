@echo off
echo ========================================
echo    LANCEMENT DEMO MEMOLIB
echo ========================================
echo.

echo [1/4] Verification API...
curl -s http://localhost:5078/health > nul 2>&1
if %errorlevel% neq 0 (
    echo API non demarree, demarrage en cours...
    start /B dotnet run --urls "http://localhost:5078"
    echo Attente demarrage API...
    timeout /t 8 /nobreak > nul
) else (
    echo API deja active
)

echo.
echo [2/4] Test connexion compte...
curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"sarraboudjellal57@gmail.com\",\"password\":\"SecurePass123!\"}" http://localhost:5078/api/auth/login > nul 2>&1
if %errorlevel% equ 0 (
    echo Compte OK
) else (
    echo Erreur compte
)

echo.
echo [3/4] Ouverture interface web...
start http://localhost:5078/demo.html

echo.
echo [4/4] Instructions:
echo ========================================
echo 1. Se connecter avec:
echo    Email: sarraboudjellal57@gmail.com
echo    Password: SecurePass123!
echo.
echo 2. Cliquer sur le bouton "DEMO AUTO"
echo    en haut a droite
echo.
echo 3. La demo se lance automatiquement
echo ========================================
echo.
pause