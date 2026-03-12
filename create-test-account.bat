@echo off
echo ========================================
echo   CREATION COMPTE TEST - MemoLib
echo ========================================
echo.

set EMAIL=sarraboudjellal57@gmail.com
set PASSWORD=SecurePass123!
set NAME=Sarra Boudjellal

echo Creation du compte: %EMAIL%
echo.

curl -X POST http://localhost:5078/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\",\"name\":\"%NAME%\",\"role\":\"AVOCAT\",\"plan\":\"CABINET\"}"

echo.
echo.
echo ========================================
echo   Compte cree avec succes!
echo ========================================
echo.
echo Email: %EMAIL%
echo Mot de passe: %PASSWORD%
echo.
echo Vous pouvez maintenant vous connecter.
echo.
pause
