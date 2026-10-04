@echo off
setlocal EnableExtensions

cd /d C:\Users\moros\Desktop\memolib

echo ============================================================
echo MEMOLIB - FIX CSP + VERCEL PROD
echo ============================================================
echo.

if not exist vercel.json (
    echo [FAIL] vercel.json introuvable.
    pause
    exit /b 1
)

echo [1/6] Sauvegarde de vercel.json...
copy /Y vercel.json vercel.json.bak >nul

if errorlevel 1 (
    echo [FAIL] Impossible de creer la sauvegarde.
    pause
    exit /b 1
)

echo [PASS] vercel.json.bak cree.
echo.

echo [2/6] Verification de la CSP...

findstr /C:"Content-Security-Policy" vercel.json >nul

if errorlevel 1 (
    echo [FAIL] Content-Security-Policy introuvable.
    echo Aucun changement effectue.
    pause
    exit /b 1
)

echo [PASS] Content-Security-Policy trouve.
echo.

echo [3/6] Modification automatique...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$p='vercel.json';" ^
"$raw=Get-Content -Raw -LiteralPath $p;" ^
"$pattern='(?s)(\"key\"\s*:\s*\"Content-Security-Policy\"\s*,\s*\"value\"\s*:\s*\")[^\"]*(\")';" ^
"$csp=\"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://vercel.live https://va.vercel-scripts.com https://clerk.memolib.space https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-src 'self' https://clerk.memolib.space https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;\";" ^
"$new=[regex]::Replace($raw,$pattern,('$1'+$csp+'$2'),1);" ^
"if($new -eq $raw){Write-Host '[FAIL] CSP non modifiee.'; exit 1};" ^
"[IO.File]::WriteAllText((Resolve-Path $p),$new,(New-Object System.Text.UTF8Encoding($false)));"

if errorlevel 1 (
    echo [FAIL] Modification echouee.
    echo Restauration de la sauvegarde...
    copy /Y vercel.json.bak vercel.json >nul
    pause
    exit /b 1
)

echo [PASS] CSP modifiee.
echo.

echo [4/6] Verification de clerk.memolib.space...

findstr /C:"https://clerk.memolib.space" vercel.json >nul

if errorlevel 1 (
    echo [FAIL] clerk.memolib.space ABSENT.
    echo Restauration automatique...
    copy /Y vercel.json.bak vercel.json >nul
    pause
    exit /b 1
)

echo [PASS] clerk.memolib.space PRESENT.
echo.

echo [5/6] Verification des directives principales...

findstr /C:"frame-ancestors 'none'" vercel.json >nul
if errorlevel 1 echo [WARN] frame-ancestors absent

findstr /C:"connect-src" vercel.json >nul
if errorlevel 1 echo [WARN] connect-src absent

findstr /C:"https://*.clerk.com" vercel.json >nul
if errorlevel 1 echo [WARN] *.clerk.com absent

findstr /C:"https://*.clerk.accounts.dev" vercel.json >nul
if errorlevel 1 echo [WARN] *.clerk.accounts.dev absent

echo.
echo === CSP ACTUELLE ===
powershell -NoProfile -Command ^
"$j=Get-Content -Raw vercel.json | ConvertFrom-Json; ($j.headers | Where-Object {$_.headers.name -eq 'Content-Security-Policy'}).headers.value"

echo.
echo [6/6] DEPLOIEMENT VERCEL PRODUCTION
echo.
echo Commande :
echo npx vercel --prod
echo.

npx vercel --prod

set "DEPLOY_EXIT=%errorlevel%"

echo.
echo ============================================================
echo RESULTAT
echo ============================================================

if "%DEPLOY_EXIT%"=="0" (
    echo [PASS] Deploiement Vercel termine avec succes.
) else (
    echo [FAIL] Vercel a retourne le code %DEPLOY_EXIT%.
    echo.
    echo IMPORTANT : vercel.json local reste modifie.
    echo Sauvegarde disponible :
    echo vercel.json.bak
)

echo.
echo Verification finale :
findstr /C:"https://clerk.memolib.space" vercel.json

echo.
pause
exit /b %DEPLOY_EXIT%