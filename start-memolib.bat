@echo off
title MemoLib - Plateforme Juridique
echo.
echo  ============================================
echo   MemoLib - Lancement en cours...
echo  ============================================
echo.

cd /d "C:\Users\moros\Desktop\memolib"

:: Vérifier si le port 3000 est déjà utilisé
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel%==0 (
    echo  MemoLib est deja en cours d'execution!
    echo  Ouverture du navigateur...
    timeout /t 2 /nobreak >nul
    start http://localhost:3000
    exit
)

echo  Demarrage du serveur...
echo.

:: Lancer Next.js en arrière-plan
start /min cmd /c "cd /d C:\Users\moros\Desktop\memolib && npm run dev"

:: Attendre que le serveur soit prêt
echo  Attente du serveur (10-20 secondes)...
:wait_loop
timeout /t 3 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 3; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    echo    En attente...
    goto wait_loop
)

echo.
echo  MemoLib est pret!
echo  Ouverture dans le navigateur...
echo.
start http://localhost:3000

echo ============================================
echo  Pour arreter: fermez la fenetre "npm run dev"
echo ============================================
timeout /t 5 /nobreak >nul
