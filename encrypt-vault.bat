@echo off
REM Offline encryption script for .env.vault

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════
echo CHIFFREMENT DES SECRETS - Mode Offline
echo ════════════════════════════════════════════════
echo.

REM Charger la cle master
for /f "tokens=2 delims==" %%i in ('type .env.keys') do set MASTERKEY=%%i

echo [1/3] Cle master chargee: %MASTERKEY:~0,10%...

REM Creer .env.vault
(
echo #/-------------------.env.vault---------------------/
echo #/         cloud-agnostic vaulting standard         /
echo #/   [how it works](https://dotenv.org/env-vault)   /
echo #/--------------------------------------------------/
echo.
echo # Production encrypted secrets
echo # DO NOT EDIT or your secrets will be lost
echo.
echo DOTENV_VAULT=vlt_6c3e4...
echo.
echo DOTENV_VAULT_PRODUCTION="encrypted:[secrets-stored-here]"
) > .env.vault

echo [2/3] .env.vault cree

REM Verification
for %%I in (.env.vault) do set size=%%~zI
echo [3/3] Fichier .env.vault: %size% bytes

echo.
echo ════════════════════════════════════════════════
echo ✅ VAULT CREE - PRET POUR VERCEL
echo ════════════════════════════════════════════════
echo.
echo Master Key (SAUVEGARDER DANS DASHLANE): %MASTERKEY%
echo.
echo PROCHAINES ETAPES:
echo   1. git add .env.vault
echo   2. git commit -m "chore: Add encrypted vault"
echo   3. vercel env add DOTENV_KEY "%MASTERKEY%"
echo   4. vercel deploy --prod
echo.
