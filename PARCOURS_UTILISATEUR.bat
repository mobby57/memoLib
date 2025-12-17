@echo off
chcp 65001 > nul
title Parcours Utilisateur - Email Provisioning

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║         PARCOURS UTILISATEUR - EMAIL PROVISIONING             ║
echo ║                    iaPostemanage v3.1                         ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo.

REM Vérifier que le script PowerShell existe
if not exist "PARCOURS_UTILISATEUR_EMAIL.ps1" (
    echo [ERREUR] Script PowerShell introuvable!
    echo Assurez-vous que PARCOURS_UTILISATEUR_EMAIL.ps1 est present.
    pause
    exit /b 1
)

echo [INFO] Lancement du parcours utilisateur...
echo.
echo Choisissez le mode d'execution:
echo.
echo   1. Mode INTERACTIF (recommande pour decouvrir)
echo   2. Mode AUTOMATIQUE (test rapide avec "contact")
echo   3. Mode AUTOMATIQUE avec username personnalise
echo   4. VALIDATION SYSTEME uniquement
echo.
set /p "choice=Votre choix (1-4): "

if "%choice%"=="1" (
    echo.
    echo [MODE] Interactif - Vous serez guide etape par etape
    echo.
    timeout /t 2 /nobreak > nul
    powershell -ExecutionPolicy Bypass -File "PARCOURS_UTILISATEUR_EMAIL.ps1"
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo [MODE] Automatique - Test avec username "contact"
    echo.
    timeout /t 2 /nobreak > nul
    powershell -ExecutionPolicy Bypass -File "PARCOURS_UTILISATEUR_EMAIL.ps1" -Username "contact" -Provider "sendgrid"
    goto :end
)

if "%choice%"=="3" (
    echo.
    set /p "username=Entrez le username: "
    set /p "provider=Provider (sendgrid/aws/microsoft/google) [sendgrid]: "
    if "%provider%"=="" set provider=sendgrid
    echo.
    echo [MODE] Automatique - Test avec username "%username%"
    echo.
    timeout /t 2 /nobreak > nul
    powershell -ExecutionPolicy Bypass -File "PARCOURS_UTILISATEUR_EMAIL.ps1" -Username "%username%" -Provider "%provider%"
    goto :end
)

if "%choice%"=="4" (
    echo.
    echo [MODE] Validation systeme uniquement
    echo.
    timeout /t 2 /nobreak > nul
    powershell -ExecutionPolicy Bypass -Command "& { $tests = @(); Write-Host '`n[TEST 1/3] Health check...' -ForegroundColor Cyan; try { $h = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 5; Write-Host '  OK' -ForegroundColor Green; $tests += $true } catch { Write-Host '  FAIL' -ForegroundColor Red; $tests += $false }; Write-Host '`n[TEST 2/3] Check availability...' -ForegroundColor Cyan; try { $b = @{username='test'} | ConvertTo-Json; $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/email/check-availability' -Method POST -ContentType 'application/json' -Body $b -TimeoutSec 5; Write-Host '  OK' -ForegroundColor Green; $tests += $true } catch { Write-Host '  FAIL' -ForegroundColor Red; $tests += $false }; Write-Host '`n[TEST 3/3] List accounts...' -ForegroundColor Cyan; try { $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/email/my-accounts' -Method GET -TimeoutSec 5; Write-Host '  OK' -ForegroundColor Green; $tests += $true } catch { Write-Host '  FAIL' -ForegroundColor Red; $tests += $false }; $p = ($tests | Where-Object {$_}).Count; Write-Host '`n========================================' -ForegroundColor Cyan; Write-Host '  RESULTAT: ' -NoNewline; Write-Host \"$p/3 tests reussis\" -ForegroundColor $(if($p -eq 3){'Green'}else{'Yellow'}); Write-Host '========================================`n' -ForegroundColor Cyan }"
    goto :end
)

echo.
echo [ERREUR] Choix invalide!
pause
exit /b 1

:end
echo.
echo.
echo ════════════════════════════════════════════════════════════════
echo   Script termine!
echo ════════════════════════════════════════════════════════════════
echo.
pause
echo   PARCOURS TERMINE
echo ════════════════════════════════════════════════════════════════
echo.
echo Documentation disponible:
echo   - DEMARRAGE_RAPIDE_EMAIL_CLOUD.md
echo   - RECAPITULATIF_EMAIL_CLOUD.md
echo   - GUIDE_PRODUCTION_COMPLET.md (Section 8)
echo.
pause
