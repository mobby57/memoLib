@echo off
cd /d c:\Users\moros\Desktop\memolib

echo Killing all node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak

echo Starting Next.js server...
cd src\frontend
start "Next.js Server" cmd /k "npm run dev"

echo Waiting for server to start...
timeout /t 8 /nobreak

echo Testing webhook API...
cd c:\Users\moros\Desktop\memolib
node test-webhook-audit.js

pause
