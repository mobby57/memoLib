@echo off
chcp 65001 >nul
title Test SMS Direct

echo.
echo TEST SMS DIRECT
echo.

where curl >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] curl n'est pas installe ou indisponible dans le PATH.
    pause
    exit /b 1
)

set "BASE_URL=http://localhost:5078"
set "TO_NUMBER=+33603983706"

set /p EMAIL="Email: "
if "%EMAIL%"=="" (
    echo [ERREUR] Email obligatoire.
    pause
    exit /b 1
)

for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$sec=Read-Host 'Mot de passe' -AsSecureString; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec); [Runtime.InteropServices.Marshal]::PtrToStringAuto($b)"`) do set "PASSWORD=%%p"

set /p TO_NUMBER="Numero destinataire (defaut %TO_NUMBER%): "
if "%TO_NUMBER%"=="" set "TO_NUMBER=+33603983706"

set /p MESSAGE="Message (defaut 'Test SMS MemoLib'): "
if "%MESSAGE%"=="" set "MESSAGE=Test SMS MemoLib"

echo.
echo Authentification...

curl -s -X POST %BASE_URL%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"%PASSWORD%\"}" > token.tmp

for /f "usebackq delims=" %%t in (`powershell -NoProfile -Command "$j=Get-Content -Raw 'token.tmp' ^| ConvertFrom-Json; if($j.token){$j.token}elseif($j.accessToken){$j.accessToken}"`) do set "TOKEN=%%t"

if "%TOKEN%"=="" (
    echo [ERREUR] Authentification echouee
    type token.tmp
    del token.tmp
    pause
    exit /b 1
)

echo [OK] Authentifie

echo.
echo Envoi SMS vers %TO_NUMBER%...

curl -s -X POST %BASE_URL%/api/messaging/sms/send ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"to\":\"%TO_NUMBER%\",\"body\":\"%MESSAGE%\"}"

echo.
echo.
echo [OK] SMS envoye!
echo Verifiez votre telephone.

del token.tmp
pause
