@echo off
echo Arret des serveurs MemoLib...

echo Arret API .NET (port 5078)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5078') do taskkill /PID %%a /F 2>nul

echo Arret API .NET (port 7009)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7009') do taskkill /PID %%a /F 2>nul

echo Arret Next.js (port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F 2>nul

echo.
echo Tous les serveurs ont ete arretes.
pause