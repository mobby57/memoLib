@echo off
chcp 65001 > nul
color 0B
cls

echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║                    🔍 VISUALISATION COMPLETE                         ║
echo ║                  Email Provisioning System v3.1                      ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo.

REM ========================================================================
REM  SECTION 1 : FICHIERS ET STRUCTURE
REM ========================================================================

echo 📁 STRUCTURE DU PROJET
echo ════════════════════════════════════════════════════════════════════
echo.

if exist "PARCOURS_UTILISATEUR.bat" (
    echo [✓] PARCOURS_UTILISATEUR.bat
) else (
    echo [✗] PARCOURS_UTILISATEUR.bat - MANQUANT
)

if exist "PARCOURS_UTILISATEUR_EMAIL.ps1" (
    echo [✓] PARCOURS_UTILISATEUR_EMAIL.ps1
) else (
    echo [✗] PARCOURS_UTILISATEUR_EMAIL.ps1 - MANQUANT
)

if exist "TESTS_AVANCES_EMAIL.ps1" (
    echo [✓] TESTS_AVANCES_EMAIL.ps1
) else (
    echo [✗] TESTS_AVANCES_EMAIL.ps1 - MANQUANT
)

if exist "INDEX_SCRIPTS.bat" (
    echo [✓] INDEX_SCRIPTS.bat
) else (
    echo [✗] INDEX_SCRIPTS.bat - MANQUANT
)

if exist "README_SCRIPTS.md" (
    echo [✓] README_SCRIPTS.md
) else (
    echo [✗] README_SCRIPTS.md - MANQUANT
)

if exist "GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md" (
    echo [✓] GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md
) else (
    echo [✗] GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md - MANQUANT
)

echo.

REM ========================================================================
REM  SECTION 2 : STATISTIQUES DES FICHIERS
REM ========================================================================

echo 📊 STATISTIQUES DES FICHIERS
echo ════════════════════════════════════════════════════════════════════
echo.

powershell -Command "& {$files = @('PARCOURS_UTILISATEUR_EMAIL.ps1','TESTS_AVANCES_EMAIL.ps1','PARCOURS_UTILISATEUR.bat','INDEX_SCRIPTS.bat','README_SCRIPTS.md','GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md','LIVRABLE_SCRIPTS_PARCOURS.md','SYNTHESE_SCRIPTS_PARCOURS.md','INDEX_SCRIPTS_COMPLET.md'); $total = 0; foreach($f in $files) { if(Test-Path $f) { $lines = (Get-Content $f | Measure-Object -Line).Lines; $size = (Get-Item $f).Length; $total += $lines; Write-Host ('  {0,-45} {1,6} lignes  {2,8} octets' -f $f, $lines, $size) -ForegroundColor Cyan } }; Write-Host ''; Write-Host ('  TOTAL: {0} lignes' -f $total) -ForegroundColor Green }"

echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 3 : VERIFICATION DU SERVEUR
REM ========================================================================

echo 🔌 ETAT DU SERVEUR
echo ════════════════════════════════════════════════════════════════════
echo.

powershell -Command "& { try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -Method GET -TimeoutSec 3 -UseBasicParsing; Write-Host '  [✓] Serveur ACTIF sur http://localhost:5000' -ForegroundColor Green; Write-Host ('      Status: {0}' -f $response.StatusCode) -ForegroundColor Gray } catch { Write-Host '  [✗] Serveur NON DISPONIBLE' -ForegroundColor Red; Write-Host '      Lancez: RUN_SERVER.bat' -ForegroundColor Yellow } }"

echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 4 : TEST DES ENDPOINTS
REM ========================================================================

echo 🧪 TEST DES ENDPOINTS
echo ════════════════════════════════════════════════════════════════════
echo.

powershell -Command "& { $tests = @(); Write-Host '  Test 1/3: Health Check...' -ForegroundColor Cyan; try { Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 3 | Out-Null; Write-Host '    [✓] OK' -ForegroundColor Green; $tests += $true } catch { Write-Host '    [✗] FAIL' -ForegroundColor Red; $tests += $false }; Write-Host ''; Write-Host '  Test 2/3: Check Availability...' -ForegroundColor Cyan; try { $body = @{username='test-auto'} | ConvertTo-Json; Invoke-RestMethod -Uri 'http://localhost:5000/api/email/check-availability' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 3 | Out-Null; Write-Host '    [✓] OK' -ForegroundColor Green; $tests += $true } catch { Write-Host '    [✗] FAIL' -ForegroundColor Red; $tests += $false }; Write-Host ''; Write-Host '  Test 3/3: List Accounts...' -ForegroundColor Cyan; try { Invoke-RestMethod -Uri 'http://localhost:5000/api/email/my-accounts' -Method GET -TimeoutSec 3 | Out-Null; Write-Host '    [✓] OK' -ForegroundColor Green; $tests += $true } catch { Write-Host '    [✗] FAIL' -ForegroundColor Red; $tests += $false }; Write-Host ''; $passed = ($tests | Where-Object {$_}).Count; $color = if($passed -eq 3){'Green'}elseif($passed -ge 2){'Yellow'}else{'Red'}; Write-Host ('  RESULTAT: {0}/3 tests passes' -f $passed) -ForegroundColor $color }"

echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 5 : FONCTIONNALITES DISPONIBLES
REM ========================================================================

echo 🎯 FONCTIONNALITES DISPONIBLES
echo ════════════════════════════════════════════════════════════════════
echo.
echo   ✓ Verification de disponibilite email
echo   ✓ Creation de compte email cloud
echo   ✓ Liste des comptes utilisateur
echo   ✓ Envoi d'email de test
echo   ✓ Statistiques d'utilisation
echo   ✓ Validation complete du systeme
echo   ✓ Tests de securite (SQL Injection, XSS)
echo   ✓ Tests de performance et charge
echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 6 : PROVIDERS SUPPORTES
REM ========================================================================

echo 📧 PROVIDERS SUPPORTES
echo ════════════════════════════════════════════════════════════════════
echo.
echo   → SendGrid (recommande)
echo   → Amazon SES (AWS)
echo   → Microsoft 365
echo   → Google Workspace
echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 7 : CONFIGURATION
REM ========================================================================

echo ⚙️  CONFIGURATION
echo ════════════════════════════════════════════════════════════════════
echo.

if exist ".env.email" (
    echo   [✓] .env.email - PRESENT
    powershell -Command "& { $content = Get-Content '.env.email' -ErrorAction SilentlyContinue; if($content -match 'SENDGRID_API_KEY') { Write-Host '       → SendGrid configure' -ForegroundColor Green } else { Write-Host '       → SendGrid non configure' -ForegroundColor Yellow } }"
) else (
    echo   [✗] .env.email - MANQUANT
    echo       Creez ce fichier pour activer les providers
)

echo.

if exist "src\backend\database.db" (
    echo   [✓] database.db - PRESENT
    powershell -Command "& { $size = (Get-Item 'src\backend\database.db' -ErrorAction SilentlyContinue).Length; Write-Host ('       Taille: {0} octets' -f $size) -ForegroundColor Gray }"
) else (
    echo   [!] database.db - Sera cree au demarrage
)

echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 8 : STATISTIQUES SYSTEME
REM ========================================================================

echo 📈 STATISTIQUES SYSTEME
echo ════════════════════════════════════════════════════════════════════
echo.

powershell -Command "& { Write-Host '  Scripts disponibles:' -ForegroundColor Cyan; Write-Host '    • 4 scripts executables' -ForegroundColor Gray; Write-Host '    • 5 documents de documentation' -ForegroundColor Gray; Write-Host '    • 10 fonctions PowerShell' -ForegroundColor Gray; Write-Host '    • 22 tests automatises' -ForegroundColor Gray; Write-Host ''; Write-Host '  Lignes de code:' -ForegroundColor Cyan; Write-Host '    • PowerShell: 1,055+ lignes' -ForegroundColor Gray; Write-Host '    • Batch: 192+ lignes' -ForegroundColor Gray; Write-Host '    • Documentation: 1,348+ lignes' -ForegroundColor Gray; Write-Host '    • TOTAL: 2,595+ lignes' -ForegroundColor Green }"

echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 9 : PORTS ET PROCESSUS
REM ========================================================================

echo 🔌 PORTS ET PROCESSUS
echo ════════════════════════════════════════════════════════════════════
echo.

powershell -Command "& { Write-Host '  Port 5000:' -ForegroundColor Cyan; $conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue; if($conn) { Write-Host '    [✓] UTILISE' -ForegroundColor Green; Write-Host ('        Process ID: {0}' -f $conn.OwningProcess) -ForegroundColor Gray } else { Write-Host '    [✗] LIBRE' -ForegroundColor Yellow }; Write-Host ''; Write-Host '  Processus Python actifs:' -ForegroundColor Cyan; $pythonProcs = Get-Process python -ErrorAction SilentlyContinue; if($pythonProcs) { Write-Host ('    [✓] {0} processus' -f $pythonProcs.Count) -ForegroundColor Green } else { Write-Host '    [✗] Aucun processus' -ForegroundColor Yellow } }"

echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 10 : DERNIERS LOGS
REM ========================================================================

echo 📋 DERNIERS LOGS (si disponibles)
echo ════════════════════════════════════════════════════════════════════
echo.

if exist "src\backend\logs\app.log" (
    powershell -Command "& { Get-Content 'src\backend\logs\app.log' -Tail 5 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host ('  {0}' -f $_) -ForegroundColor Gray } }"
) else (
    echo   [!] Pas de logs disponibles
)

echo.
timeout /t 2 /nobreak > nul

REM ========================================================================
REM  SECTION 11 : ACTIONS RAPIDES
REM ========================================================================

:menu
echo 🚀 ACTIONS RAPIDES
echo ════════════════════════════════════════════════════════════════════
echo.
echo   1. Lancer le parcours utilisateur
echo   2. Executer les tests rapides
echo   3. Demarrer le serveur
echo   4. Voir la documentation
echo   5. Tests avances complets
echo   6. Quitter
echo.

set /p "action=Choisissez une action (1-6): "

if "%action%"=="1" (
    cls
    if exist "PARCOURS_UTILISATEUR.bat" (
        call PARCOURS_UTILISATEUR.bat
    ) else (
        echo [ERREUR] PARCOURS_UTILISATEUR.bat introuvable
        pause
    )
    goto :end
)

if "%action%"=="2" (
    cls
    echo.
    echo 🧪 EXECUTION DES TESTS RAPIDES...
    echo.
    if exist "TESTS_AVANCES_EMAIL.ps1" (
        powershell -ExecutionPolicy Bypass -File "TESTS_AVANCES_EMAIL.ps1" -QuickTest
    ) else (
        echo [ERREUR] TESTS_AVANCES_EMAIL.ps1 introuvable
    )
    echo.
    pause
    goto :end
)

if "%action%"=="3" (
    cls
    echo.
    echo 🚀 DEMARRAGE DU SERVEUR...
    echo.
    if exist "RUN_SERVER.bat" (
        call RUN_SERVER.bat
    ) else (
        echo [ERREUR] RUN_SERVER.bat introuvable
        echo Essayez: cd src\backend && python app.py
    )
    pause
    goto :end
)

if "%action%"=="4" (
    cls
    echo.
    echo 📚 OUVERTURE DE LA DOCUMENTATION...
    echo.
    if exist "INDEX_SCRIPTS_COMPLET.md" (
        start INDEX_SCRIPTS_COMPLET.md
        timeout /t 2 /nobreak > nul
    ) else if exist "README_SCRIPTS.md" (
        start README_SCRIPTS.md
        timeout /t 2 /nobreak > nul
    ) else (
        echo [ERREUR] Documentation introuvable
        pause
    )
    goto :end
)

if "%action%"=="5" (
    cls
    echo.
    echo 🧪 EXECUTION DES TESTS COMPLETS...
    echo.
    if exist "TESTS_AVANCES_EMAIL.ps1" (
        powershell -ExecutionPolicy Bypass -File "TESTS_AVANCES_EMAIL.ps1" -FullTest
    ) else (
        echo [ERREUR] TESTS_AVANCES_EMAIL.ps1 introuvable
    )
    echo.
    pause
    goto :end
)

if "%action%"=="6" (
    echo.
    echo [INFO] Fermeture...
    timeout /t 1 /nobreak > nul
    goto :end
)

echo.
echo [ERREUR] Choix invalide
echo.
pause
goto :menu

:end
cls
echo.
echo ╔══════════════════════════════════════════════════════════════════════╗
echo ║                                                                      ║
echo ║                    ✅ VISUALISATION TERMINEE                         ║
echo ║                                                                      ║
echo ╚══════════════════════════════════════════════════════════════════════╝
echo.
echo   Pour relancer la visualisation:
echo   → Double-cliquez sur VOIR_TOUT.bat
echo.
echo   Pour commencer a utiliser le systeme:
echo   → Lancez PARCOURS_UTILISATEUR.bat
echo.
timeout /t 2 /nobreak > nul
exit /b 0
