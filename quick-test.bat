@echo off
setlocal enabledelayedexpansion
set BASE=http://localhost:5078
set /a RAND=%RANDOM%

echo [START] Tests API MemoLib - Suite Complete
echo.

REM 1. Register
echo [1/15] Register...
curl -s -X POST %BASE%/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test%RAND%@test.com\",\"password\":\"Test123!@#\",\"name\":\"Test\",\"plan\":\"CABINET\"}" > r.json
findstr "id" r.json >nul && echo [OK] Register || echo [FAIL] Register

REM 2. Login
echo [2/15] Login...
curl -s -X POST %BASE%/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test%RAND%@test.com\",\"password\":\"Test123!@#\"}" > l.json
for /f "tokens=2 delims=:," %%a in ('findstr "token" l.json') do set T=%%a
set T=%T:"=%
set T=%T: =%
findstr "token" l.json >nul && echo [OK] Login || echo [FAIL] Login

REM 3. Get Me
echo [3/15] Get Me...
curl -s -X GET %BASE%/api/auth/me -H "Authorization: Bearer %T%" > m.json
findstr "email" m.json >nul && echo [OK] Get Me || echo [FAIL] Get Me

REM 4. Create Case
echo [4/15] Create Case...
curl -s -X POST %BASE%/api/cases -H "Authorization: Bearer %T%" -H "Content-Type: application/json" -d "{\"title\":\"Test\",\"description\":\"Test\",\"clientEmail\":\"c@t.com\",\"clientName\":\"C\",\"status\":\"OPEN\",\"priority\":3}" > c.json
for /f "tokens=2 delims=:," %%a in ('findstr "\"id\"" c.json') do set CID=%%a
set CID=%CID:"=%
set CID=%CID: =%
findstr "id" c.json >nul && echo [OK] Create Case || echo [FAIL] Create Case

REM 5. Get Cases
echo [5/15] Get Cases...
curl -s -X GET %BASE%/api/cases -H "Authorization: Bearer %T%" > cs.json
findstr "[" cs.json >nul && echo [OK] Get Cases || echo [FAIL] Get Cases

REM 6. Get Case by ID
echo [6/15] Get Case by ID...
curl -s -X GET %BASE%/api/cases/%CID% -H "Authorization: Bearer %T%" > ci.json
findstr "id" ci.json >nul && echo [OK] Get Case || echo [FAIL] Get Case

REM 7. Update Status
echo [7/15] Update Status...
curl -s -X PATCH %BASE%/api/cases/%CID%/status -H "Authorization: Bearer %T%" -H "Content-Type: application/json" -d "{\"status\":\"IN_PROGRESS\"}" > us.json
findstr "IN_PROGRESS" us.json >nul && echo [OK] Update Status || echo [FAIL] Update Status

REM 8. Create Client
echo [8/15] Create Client...
curl -s -X POST %BASE%/api/client -H "Authorization: Bearer %T%" -H "Content-Type: application/json" -d "{\"email\":\"cl%RAND%@t.com\",\"name\":\"Client\",\"phone\":\"+33612345678\"}" > cl.json
findstr "id" cl.json >nul && echo [OK] Create Client || echo [FAIL] Create Client

REM 9. Get Clients
echo [9/15] Get Clients...
curl -s -X GET %BASE%/api/client -H "Authorization: Bearer %T%" > cls.json
findstr "[" cls.json >nul && echo [OK] Get Clients || echo [FAIL] Get Clients

REM 10. Ingest Email
echo [10/15] Ingest Email...
curl -s -X POST %BASE%/api/ingest/email -H "Authorization: Bearer %T%" -H "Content-Type: application/json" -d "{\"from\":\"t@c.com\",\"to\":\"a@c.fr\",\"subject\":\"Test\",\"body\":\"Body\",\"messageId\":\"t%RAND%@t.l\"}" > e.json
findstr "eventId" e.json >nul && echo [OK] Ingest Email || echo [FAIL] Ingest Email

REM 11. Get Templates
echo [11/15] Get Templates...
curl -s -X GET %BASE%/api/email/templates -H "Authorization: Bearer %T%" > ts.json
findstr "[" ts.json >nul && echo [OK] Get Templates || echo [FAIL] Get Templates

REM 12. Search
echo [12/15] Search...
curl -s -X POST %BASE%/api/search/events -H "Authorization: Bearer %T%" -H "Content-Type: application/json" -d "{\"query\":\"test\",\"limit\":10}" > s.json
findstr "[" s.json >nul && echo [OK] Search || echo [FAIL] Search

REM 13. Dashboard Stats
echo [13/15] Dashboard Stats...
curl -s -X GET %BASE%/api/dashboard/stats -H "Authorization: Bearer %T%" > d.json
findstr "{" d.json >nul && echo [OK] Dashboard || echo [FAIL] Dashboard

REM 14. Notifications
echo [14/15] Notifications...
curl -s -X GET %BASE%/api/notifications -H "Authorization: Bearer %T%" > n.json
findstr "[" n.json >nul && echo [OK] Notifications || echo [FAIL] Notifications

REM 15. Health Check
echo [15/15] Health Check...
curl -s -X GET %BASE%/health > h.json
findstr "Healthy" h.json >nul && echo [OK] Health || echo [FAIL] Health

del *.json 2>nul
echo.
echo [DONE] Tests Complete!
