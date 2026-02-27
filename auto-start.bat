@echo off
chcp 65001 >nul
cls
echo ========================================
echo   MemoLib - Configuration Automatique
echo ========================================
echo.

REM Generate JWT Secret automatically
echo [1/4] Generation JWT Secret...
powershell -Command "$secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); dotnet user-secrets set 'JwtSettings:SecretKey' $secret" >nul 2>&1
echo       OK JWT configure

REM Set default email password (empty for now)
echo [2/4] Configuration Email...
dotnet user-secrets set "EmailMonitor:Password" "" >nul 2>&1
echo       OK Email pret (monitoring desactive)

REM Check database
echo [3/4] Verification base de donnees...
if exist memolib.db (
    echo       OK Base de donnees trouvee
) else (
    echo       Creation base de donnees...
    dotnet ef database update >nul 2>&1
    echo       OK Base de donnees creee
)

REM Start application
echo [4/4] Demarrage application...
echo.
echo ========================================
echo   MemoLib demarre!
echo ========================================
echo.
echo   Interface: http://localhost:5078/demo.html
echo   API:       http://localhost:5078/api
echo   Health:    http://localhost:5078/health
echo.
echo   Appuyez sur Ctrl+C pour arreter
echo ========================================
echo.

dotnet run --urls "http://localhost:5078"
