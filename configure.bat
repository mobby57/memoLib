@echo off
echo ================================
echo Configuration MemoLib - Gratuit
echo ================================
echo.

echo 1. Email Gmail
echo    Creez un mot de passe: https://myaccount.google.com/apppasswords
set /p GMAIL_PWD="   Mot de passe Gmail (ou Entree pour ignorer): "
if not "%GMAIL_PWD%"=="" (
    dotnet user-secrets set "EmailMonitor:Password" "%GMAIL_PWD%"
    echo    OK Email configure
)

echo.
echo 2. JWT Secret - Generation automatique
powershell -Command "$secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); dotnet user-secrets set 'JwtSettings:SecretKey' $secret"
echo    OK JWT configure

echo.
echo 3. Telegram Bot (Optionnel)
echo    Creez via @BotFather sur Telegram
set /p TELEGRAM_TOKEN="   Bot Token (ou Entree pour ignorer): "
if not "%TELEGRAM_TOKEN%"=="" (
    dotnet user-secrets set "Telegram:BotToken" "%TELEGRAM_TOKEN%"
    echo    OK Telegram configure
)

echo.
echo ================================
echo Configuration terminee!
echo ================================
echo.
echo Demarrez avec: dotnet run
echo Interface: http://localhost:5078/demo.html
echo.
pause
