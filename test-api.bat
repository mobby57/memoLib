@echo off
REM Script de test simple pour MemoLib API
setlocal enabledelayedexpansion

set BASE_URL=http://localhost:5078
set PASSED=0
set FAILED=0

echo.
echo ========================================
echo [START] Tests API MemoLib
echo ========================================
echo.

REM Generate random email
set /a RAND=%RANDOM%
set TEST_EMAIL=test%RAND%@memolib.com

echo [TEST 1] Register User
curl -s -X POST %BASE_URL%/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"Test123!@#\",\"name\":\"Test User\",\"plan\":\"CABINET\"}" > temp_register.json
findstr /C:"id" temp_register.json >nul
if %errorlevel%==0 (
    echo [OK] Register User
    set /a PASSED+=1
) else (
    echo [ERROR] Register User
    set /a FAILED+=1
)

echo.
echo [TEST 2] Login User
curl -s -X POST %BASE_URL%/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"Test123!@#\"}" > temp_login.json
findstr /C:"token" temp_login.json >nul
if %errorlevel%==0 (
    echo [OK] Login User
    set /a PASSED+=1
    
    REM Extract token (simplified)
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"token" temp_login.json') do (
        set TOKEN=%%a
        set TOKEN=!TOKEN:"=!
        set TOKEN=!TOKEN: =!
    )
    echo [INFO] Token obtained
) else (
    echo [ERROR] Login User
    set /a FAILED+=1
)

if defined TOKEN (
    echo.
    echo [TEST 3] Get Current User
    curl -s -X GET %BASE_URL%/api/auth/me -H "Authorization: Bearer !TOKEN!" > temp_me.json
    findstr /C:"email" temp_me.json >nul
    if !errorlevel!==0 (
        echo [OK] Get Current User
        set /a PASSED+=1
    ) else (
        echo [ERROR] Get Current User
        set /a FAILED+=1
    )

    echo.
    echo [TEST 4] Create Case
    curl -s -X POST %BASE_URL%/api/cases -H "Authorization: Bearer !TOKEN!" -H "Content-Type: application/json" -d "{\"title\":\"Test Case\",\"description\":\"Test\",\"clientEmail\":\"client@test.com\",\"clientName\":\"Client Test\",\"status\":\"OPEN\",\"priority\":3}" > temp_case.json
    findstr /C:"id" temp_case.json >nul
    if !errorlevel!==0 (
        echo [OK] Create Case
        set /a PASSED+=1
    ) else (
        echo [ERROR] Create Case
        set /a FAILED+=1
    )

    echo.
    echo [TEST 5] Get All Cases
    curl -s -X GET %BASE_URL%/api/cases -H "Authorization: Bearer !TOKEN!" > temp_cases.json
    findstr /C:"[" temp_cases.json >nul
    if !errorlevel!==0 (
        echo [OK] Get All Cases
        set /a PASSED+=1
    ) else (
        echo [ERROR] Get All Cases
        set /a FAILED+=1
    )

    echo.
    echo [TEST 6] Create Client
    curl -s -X POST %BASE_URL%/api/client -H "Authorization: Bearer !TOKEN!" -H "Content-Type: application/json" -d "{\"email\":\"client@test.com\",\"name\":\"Client Test\",\"phone\":\"+33612345678\"}" > temp_client.json
    findstr /C:"id" temp_client.json >nul
    if !errorlevel!==0 (
        echo [OK] Create Client
        set /a PASSED+=1
    ) else (
        echo [ERROR] Create Client
        set /a FAILED+=1
    )

    echo.
    echo [TEST 7] Get All Clients
    curl -s -X GET %BASE_URL%/api/client -H "Authorization: Bearer !TOKEN!" > temp_clients.json
    findstr /C:"[" temp_clients.json >nul
    if !errorlevel!==0 (
        echo [OK] Get All Clients
        set /a PASSED+=1
    ) else (
        echo [ERROR] Get All Clients
        set /a FAILED+=1
    )

    echo.
    echo [TEST 8] Ingest Email
    curl -s -X POST %BASE_URL%/api/ingest/email -H "Authorization: Bearer !TOKEN!" -H "Content-Type: application/json" -d "{\"from\":\"test@client.com\",\"to\":\"avocat@cabinet.fr\",\"subject\":\"Test Email\",\"body\":\"Test body\",\"messageId\":\"test-%RAND%@test.local\"}" > temp_email.json
    findstr /C:"eventId" temp_email.json >nul
    if !errorlevel!==0 (
        echo [OK] Ingest Email
        set /a PASSED+=1
    ) else (
        echo [ERROR] Ingest Email
        set /a FAILED+=1
    )

    echo.
    echo [TEST 9] Get Email Templates
    curl -s -X GET %BASE_URL%/api/email/templates -H "Authorization: Bearer !TOKEN!" > temp_templates.json
    findstr /C:"[" temp_templates.json >nul
    if !errorlevel!==0 (
        echo [OK] Get Email Templates
        set /a PASSED+=1
    ) else (
        echo [ERROR] Get Email Templates
        set /a FAILED+=1
    )

    echo.
    echo [TEST 10] Get Notifications
    curl -s -X GET %BASE_URL%/api/notifications -H "Authorization: Bearer !TOKEN!" > temp_notif.json
    findstr /C:"[" temp_notif.json >nul
    if !errorlevel!==0 (
        echo [OK] Get Notifications
        set /a PASSED+=1
    ) else (
        echo [ERROR] Get Notifications
        set /a FAILED+=1
    )
)

REM Cleanup
del temp_*.json 2>nul

echo.
echo ========================================
echo [RESULTS] RESULTATS DES TESTS
echo ========================================
echo.
set /a TOTAL=%PASSED%+%FAILED%
echo Total tests: %TOTAL%
echo [OK] Tests reussis: %PASSED%
echo [ERROR] Tests echoues: %FAILED%

if %FAILED%==0 (
    echo.
    echo [SUCCESS] Tous les tests sont passes!
    exit /b 0
) else (
    echo.
    echo [WARNING] Certains tests ont echoue
    exit /b %FAILED%
)
