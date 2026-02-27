@echo off
chcp 65001 >nul
cls
echo ========================================
echo   MemoLib - Demo Auto (sarraboudjellal57)
echo ========================================
echo.

REM Configure Gmail password for demo
echo [1/5] Configuration Email sarraboudjellal57...
dotnet user-secrets set "EmailMonitor:Password" "xxbz dbcr sgxp ncuw" >nul 2>&1
echo       OK Email configure

REM Generate JWT Secret
echo [2/5] Generation JWT Secret...
powershell -Command "$secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); dotnet user-secrets set 'JwtSettings:SecretKey' $secret" >nul 2>&1
echo       OK JWT configure

REM Kill existing process on port 5078
echo [3/5] Liberation du port 5078...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5078') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 >nul
echo       OK Port libre

REM Check database
echo [4/5] Verification base de donnees...
if exist memolib.db (
    echo       OK Base de donnees trouvee
) else (
    echo       Creation base de donnees...
    dotnet ef database update >nul 2>&1
    echo       OK Base de donnees creee
)

REM Start application
echo [5/5] Demarrage application...
echo.
echo ========================================
echo   MemoLib DEMO READY!
echo ========================================
echo.
echo   Email:     sarraboudjellal57@gmail.com
echo   Interface: http://localhost:5078/demo.html
echo   API:       http://localhost:5078/api
echo   Health:    http://localhost:5078/health
echo.
echo   Monitoring email actif (60s)
echo   Appuyez sur Ctrl+C pour arreter
echo ========================================
echo.

dotnet run --urls "http://localhost:5078"
