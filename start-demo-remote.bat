@echo off
echo ========================================
echo   MemoLib - Demo HTTPS a Distance
echo ========================================
echo.

REM Verifier si ngrok est installe
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] ngrok n'est pas installe !
    echo.
    echo Telechargez ngrok sur: https://ngrok.com/download
    echo Ou installez via: choco install ngrok
    echo.
    pause
    exit /b 1
)

echo [1/3] Demarrage API .NET (HTTPS)...
start "MemoLib API" cmd /k "dotnet run"
timeout /t 8 /nobreak >nul

echo [2/3] Exposition via ngrok avec authentification...
start "ngrok Tunnel" cmd /k "ngrok http 5078 --basic-auth demo:MemoLib2025!"
timeout /t 3 /nobreak >nul

echo [3/3] Ouverture dashboard ngrok...
start http://localhost:4040

echo.
echo ========================================
echo   Demo HTTPS Active !
echo ========================================
echo.
echo 1. Recuperez l'URL HTTPS dans le dashboard ngrok
echo 2. Partagez avec vos participants:
echo.
echo    URL: https://xxxx.ngrok-free.app
echo    Username: demo
echo    Password: MemoLib2025!
echo.
echo Dashboard ngrok: http://localhost:4040
echo.
echo Appuyez sur une touche pour fermer...
pause >nul