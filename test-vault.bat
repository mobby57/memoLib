@echo off
echo ========================================
echo TEST COFFRE-FORT MEMOLIB
echo ========================================
echo.

echo [1/4] Compilation...
dotnet build --nologo -v q
if %errorlevel% neq 0 (
    echo ECHEC: Erreur de compilation
    exit /b 1
)
echo OK: Compilation reussie

echo.
echo [2/4] Verification base de donnees...
if exist memolib.db (
    echo OK: Base de donnees presente
) else (
    echo ECHEC: Base de donnees manquante
    exit /b 1
)

echo.
echo [3/4] Verification migrations...
dotnet ef migrations list --no-build 2>nul | findstr "AddSecretVault" >nul
if %errorlevel% equ 0 (
    echo OK: Migration SecretVault presente
) else (
    echo ECHEC: Migration SecretVault manquante
    exit /b 1
)

echo.
echo [4/4] Verification fichiers...
if exist "Services\VaultService.cs" (
    echo OK: VaultService.cs
) else (
    echo ECHEC: VaultService.cs manquant
    exit /b 1
)

if exist "Controllers\VaultController.cs" (
    echo OK: VaultController.cs
) else (
    echo ECHEC: VaultController.cs manquant
    exit /b 1
)

if exist "Models\SecretVault.cs" (
    echo OK: SecretVault.cs
) else (
    echo ECHEC: SecretVault.cs manquant
    exit /b 1
)

if exist "wwwroot\vault.html" (
    echo OK: vault.html
) else (
    echo ECHEC: vault.html manquant
    exit /b 1
)

echo.
echo ========================================
echo TOUS LES TESTS PASSES
echo ========================================
echo.
echo Lancer l'application:
echo   dotnet run
echo.
echo Acceder au coffre-fort:
echo   http://localhost:5078/vault.html
echo.
