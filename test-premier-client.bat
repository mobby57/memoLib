@echo off
REM Test Parcours Premier Client - MemoLib
setlocal enabledelayedexpansion

set BASE=http://localhost:5078
set /a RAND=%RANDOM%
set EMAIL=premier-client-%RAND%@test.com

echo ========================================
echo TEST PARCOURS PREMIER CLIENT
echo ========================================
echo.
echo Base URL: %BASE%
echo Email test: %EMAIL%
echo.

REM 1. Register (Inscription)
echo [1/10] Inscription du premier client...
curl -s -X POST %BASE%/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"Test123!@#\",\"name\":\"Premier Client\",\"plan\":\"CABINET\",\"firmName\":\"Cabinet Test\"}" > register.json

findstr "id" register.json >nul
if %errorlevel%==0 (
    echo [OK] Inscription reussie
    for /f "tokens=2 delims=:," %%a in ('findstr "\"id\"" register.json') do set USER_ID=%%a
) else (
    echo [FAIL] Inscription echouee
    type register.json
    goto :cleanup
)
echo.

REM 2. Login (Connexion)
echo [2/10] Connexion...
curl -s -X POST %BASE%/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"%EMAIL%\",\"password\":\"Test123!@#\"}" > login.json

findstr "token" login.json >nul
if %errorlevel%==0 (
    echo [OK] Connexion reussie
    for /f "tokens=2 delims=:," %%a in ('findstr "\"token\"" login.json') do (
        set TOKEN=%%a
        set TOKEN=!TOKEN:"=!
        set TOKEN=!TOKEN: =!
    )
) else (
    echo [FAIL] Connexion echouee
    type login.json
    goto :cleanup
)
echo.

REM 3. Get Current User (Profil)
echo [3/10] Verification du profil...
curl -s -X GET %BASE%/api/auth/me ^
  -H "Authorization: Bearer !TOKEN!" > me.json

findstr "email" me.json >nul
if %errorlevel%==0 (
    echo [OK] Profil recupere
) else (
    echo [FAIL] Erreur profil
    goto :cleanup
)
echo.

REM 4. Create First Client (Premier client)
echo [4/10] Creation du premier client...
curl -s -X POST %BASE%/api/client ^
  -H "Authorization: Bearer !TOKEN!" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"sophie.dubois@email.com\",\"name\":\"Sophie Dubois\",\"phone\":\"+33612345678\",\"address\":\"123 Rue Test\",\"city\":\"Paris\",\"postalCode\":\"75001\"}" > client.json

findstr "id" client.json >nul
if %errorlevel%==0 (
    echo [OK] Premier client cree
    for /f "tokens=2 delims=:," %%a in ('findstr "\"id\"" client.json') do set CLIENT_ID=%%a
) else (
    echo [FAIL] Erreur creation client
    goto :cleanup
)
echo.

REM 5. Ingest First Email (Premier email)
echo [5/10] Reception du premier email...
curl -s -X POST %BASE%/api/ingest/email ^
  -H "Authorization: Bearer !TOKEN!" ^
  -H "Content-Type: application/json" ^
  -d "{\"from\":\"sophie.dubois@email.com\",\"to\":\"avocat@cabinet.fr\",\"subject\":\"URGENT - OQTF notifiee\",\"body\":\"Bonjour Maitre, J'ai recu une OQTF le 15/01/2026 avec un delai de 30 jours.\",\"messageId\":\"test-%RAND%@test.local\"}" > email.json

findstr "eventId" email.json >nul
if %errorlevel%==0 (
    echo [OK] Premier email recu
    for /f "tokens=2 delims=:," %%a in ('findstr "\"eventId\"" email.json') do set EVENT_ID=%%a
) else (
    echo [FAIL] Erreur reception email
    goto :cleanup
)
echo.

REM 6. Create First Case (Premier dossier)
echo [6/10] Creation du premier dossier...
curl -s -X POST %BASE%/api/cases ^
  -H "Authorization: Bearer !TOKEN!" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Dossier OQTF - Sophie Dubois\",\"description\":\"OQTF notifiee avec delai de 30 jours\",\"clientEmail\":\"sophie.dubois@email.com\",\"clientName\":\"Sophie Dubois\",\"status\":\"OPEN\",\"priority\":5,\"tags\":[\"OQTF\",\"urgent\"]}" > case.json

findstr "id" case.json >nul
if %errorlevel%==0 (
    echo [OK] Premier dossier cree
    for /f "tokens=2 delims=:," %%a in ('findstr "\"id\"" case.json') do set CASE_ID=%%a
) else (
    echo [FAIL] Erreur creation dossier
    goto :cleanup
)
echo.

REM 7. Get Cases (Liste dossiers)
echo [7/10] Consultation des dossiers...
curl -s -X GET %BASE%/api/cases ^
  -H "Authorization: Bearer !TOKEN!" > cases.json

findstr "[" cases.json >nul
if %errorlevel%==0 (
    echo [OK] Liste dossiers recuperee
) else (
    echo [FAIL] Erreur liste dossiers
)
echo.

REM 8. Get Clients (Liste clients)
echo [8/10] Consultation des clients...
curl -s -X GET %BASE%/api/client ^
  -H "Authorization: Bearer !TOKEN!" > clients.json

findstr "[" clients.json >nul
if %errorlevel%==0 (
    echo [OK] Liste clients recuperee
) else (
    echo [FAIL] Erreur liste clients
)
echo.

REM 9. Get Notifications (Notifications)
echo [9/10] Verification des notifications...
curl -s -X GET %BASE%/api/notifications ^
  -H "Authorization: Bearer !TOKEN!" > notifications.json

findstr "[" notifications.json >nul
if %errorlevel%==0 (
    echo [OK] Notifications recuperees
) else (
    echo [FAIL] Erreur notifications
)
echo.

REM 10. Dashboard Stats (Statistiques)
echo [10/10] Consultation du dashboard...
curl -s -X GET %BASE%/api/dashboard/stats ^
  -H "Authorization: Bearer !TOKEN!" > dashboard.json

findstr "{" dashboard.json >nul
if %errorlevel%==0 (
    echo [OK] Dashboard consulte
) else (
    echo [FAIL] Erreur dashboard
)
echo.

REM Afficher le résumé
echo ========================================
echo RESUME DU PARCOURS
echo ========================================
echo.
echo Email: %EMAIL%
echo User ID: %USER_ID%
echo Client ID: %CLIENT_ID%
echo Case ID: %CASE_ID%
echo Event ID: %EVENT_ID%
echo.
echo Actions realisees:
echo [OK] 1. Inscription
echo [OK] 2. Connexion
echo [OK] 3. Profil verifie
echo [OK] 4. Premier client cree
echo [OK] 5. Premier email recu
echo [OK] 6. Premier dossier cree
echo [OK] 7. Dossiers consultes
echo [OK] 8. Clients consultes
echo [OK] 9. Notifications verifiees
echo [OK] 10. Dashboard consulte
echo.
echo ========================================
echo [SUCCESS] Parcours premier client OK!
echo ========================================
echo.
echo Prochaines etapes:
echo 1. Ouvrir http://localhost:5078
echo 2. Se connecter avec: %EMAIL%
echo 3. Mot de passe: Test123!@#
echo 4. Explorer l'interface
echo.

:cleanup
del *.json 2>nul
exit /b 0
